import { defineStore } from 'pinia'
import { reactive, computed } from 'vue'

export const useWorkspaceStore = defineStore('workspaces', () => {
  const state = reactive({
    activeId: 1,
    switchDirection: 1, // 1 = forward (→ left), -1 = backward (→ right)
    workspaces: [
      {
        id: 1,
        label: 'Main',
        panX: 0,
        panY: 0,
        scale: 1,
        widgets: [{ id: 1, x: 100, y: 100, w: 0, h: 0 }]
      },
      { id: 2, label: 'Dev', panX: 0, panY: 0, scale: 1, widgets: [] },
      { id: 3, label: 'Design', panX: 0, panY: 0, scale: 1, widgets: [] }
    ],
    // Side panel state (managed here for persistence simplicity)
    sidePanelOpen: true,
    sidePanelWidth: 420
  })

  const active = computed(() => state.workspaces.find((w) => w.id === state.activeId))

  // ── Persistence ────────────────────────────────────────────
  async function loadState() {
    if (!window.api || !window.api.auraState) return
    const saved = await window.api.auraState.load()
    if (saved && Array.isArray(saved.workspaces)) {
      // Ensure labels are never empty
      state.workspaces = saved.workspaces.map((w) => ({
        ...w,
        label:
          w.label || (w.id === 1 ? 'Main' : w.id === 2 ? 'Dev' : w.id === 3 ? 'Design' : 'Untitled')
      }))
      state.activeId = saved.activeId || state.workspaces[0].id
      if (saved.sidePanelOpen !== undefined) state.sidePanelOpen = saved.sidePanelOpen
      if (saved.sidePanelWidth !== undefined) state.sidePanelWidth = saved.sidePanelWidth
    }
  }

  function saveState() {
    if (!window.api || !window.api.auraState) return
    window.api.auraState.save('workspaces', {
      workspaces: JSON.parse(JSON.stringify(state.workspaces)),
      activeId: state.activeId,
      sidePanelOpen: state.sidePanelOpen,
      sidePanelWidth: state.sidePanelWidth
    })
  }

  // Debounced version for high-frequency events (canvas pan/zoom)
  let _saveTimer = null
  function saveStateDebounced() {
    clearTimeout(_saveTimer)
    _saveTimer = setTimeout(saveState, 500)
  }

  // ── Switch ─────────────────────────────────────────────────
  function setActive(id) {
    state.switchDirection = id > state.activeId ? 1 : -1
    state.activeId = id
    saveState()
  }

  // ── Create ─────────────────────────────────────────────────
  function createWorkspace(label = 'Untitled') {
    const id = Date.now()
    state.workspaces.push({ id, label, panX: 0, panY: 0, scale: 1, widgets: [] })
    setActive(id) // setActive calls saveState
    return id
  }

  // ── Delete ─────────────────────────────────────────────────
  function deleteWorkspace(id) {
    if (state.workspaces.length <= 1) return // always keep at least one
    const idx = state.workspaces.findIndex((w) => w.id === id)
    if (idx === -1) return
    state.workspaces.splice(idx, 1)
    // if deleted the active one, switch to adjacent
    if (state.activeId === id) {
      const next = state.workspaces[Math.max(0, idx - 1)]
      state.activeId = next.id
    }
    saveState()
  }

  // ── Rename ─────────────────────────────────────────────────
  function renameWorkspace(id, label) {
    const ws = state.workspaces.find((w) => w.id === id)
    if (ws) {
      ws.label = label.trim() || ws.label
      saveState()
    }
  }

  // ── Canvas ─────────────────────────────────────────────────
  function updateCanvas({ panX, panY, scale }) {
    const ws = active.value
    if (!ws) return
    if (panX !== undefined) ws.panX = panX
    if (panY !== undefined) ws.panY = panY
    if (scale !== undefined) ws.scale = scale
    // Debounced — avoids IPC write on every mousemove pixel
    saveStateDebounced()
  }

  // ── Widgets ────────────────────────────────────────────────
  function addWidget(widget) {
    const ws = active.value
    if (!ws) return
    const id = Date.now()
    ws.widgets.push({ id, x: 120, y: 120, w: 0, h: 0, ...widget })
    saveState()
    return id
  }

  function updateWidget(widgetId, props) {
    const ws = active.value
    if (!ws) return
    const widget = ws.widgets.find((wg) => wg.id === widgetId)
    if (!widget) return
    if (props.x !== undefined) widget.x = props.x
    if (props.y !== undefined) widget.y = props.y
    if (props.w !== undefined) widget.w = props.w
    if (props.h !== undefined) widget.h = props.h
    if (props.data !== undefined) widget.data = props.data
    if (props.title !== undefined) widget.title = props.title
    if (props.contentScale !== undefined) widget.contentScale = props.contentScale
    saveState()
  }

  function removeWidget(widgetId) {
    const ws = active.value
    if (!ws) return
    const idx = ws.widgets.findIndex((wg) => wg.id === widgetId)
    if (idx !== -1) {
      ws.widgets.splice(idx, 1)
      saveState()
    }
  }

  // ── Side Panel ─────────────────────────────────────────────
  function updateSidePanel(isOpen, width) {
    if (isOpen !== undefined) state.sidePanelOpen = isOpen
    if (width !== undefined) state.sidePanelWidth = width
    saveState()
  }

  // Load state on init
  loadState()

  return {
    state,
    active,
    setActive,
    createWorkspace,
    deleteWorkspace,
    renameWorkspace,
    updateCanvas,
    addWidget,
    updateWidget,
    removeWidget,
    updateSidePanel,
    loadState
  }
})
