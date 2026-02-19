import { reactive, computed } from 'vue'

// ── Workspace store (singleton) ────────────────────────────────
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
      widgets: [
        { id: 1, x: 100, y: 100, w: 0, h: 0 },
      ],
    },
    {
      id: 2,
      label: 'Dev',
      panX: 0,
      panY: 0,
      scale: 1,
      widgets: [],
    },
    {
      id: 3,
      label: 'Design',
      panX: 0,
      panY: 0,
      scale: 1,
      widgets: [],
    },
  ],
})

export function useWorkspaces() {
  const active = computed(() =>
    state.workspaces.find(w => w.id === state.activeId)
  )

  function setActive(id) {
    state.switchDirection = id > state.activeId ? 1 : -1
    state.activeId = id
  }

  function updateCanvas({ panX, panY, scale }) {
    const ws = active.value
    if (!ws) return
    if (panX  !== undefined) ws.panX  = panX
    if (panY  !== undefined) ws.panY  = panY
    if (scale !== undefined) ws.scale = scale
  }

  function updateWidget(widgetId, { x, y, w, h }) {
    const ws = active.value
    if (!ws) return
    const widget = ws.widgets.find(wg => wg.id === widgetId)
    if (!widget) return
    if (x !== undefined) widget.x = x
    if (y !== undefined) widget.y = y
    if (w !== undefined) widget.w = w
    if (h !== undefined) widget.h = h
  }

  function addWidget(widget) {
    const ws = active.value
    if (!ws) return
    const id = Date.now()
    ws.widgets.push({ id, x: 120, y: 120, w: 0, h: 0, ...widget })
    return id
  }

  return {
    state,
    active,
    setActive,
    updateCanvas,
    updateWidget,
    addWidget,
  }
}
