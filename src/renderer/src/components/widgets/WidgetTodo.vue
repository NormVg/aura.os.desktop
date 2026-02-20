<script setup>
import { ref, watch } from 'vue'
import { useWorkspaceStore } from '../../stores/workspaces'

const props = defineProps({
  id: { type: Number, required: true },
  data: { type: Object, default: () => ({}) }
})

const wsStore = useWorkspaceStore()
const items = ref(props.data?.items || [])
const inputValue = ref('')

let idCounter = Date.now()

function addTodo() {
  const text = inputValue.value.trim()
  if (!text) return

  items.value.push({
    id: idCounter++,
    text,
    completed: false,
    createdAt: Date.now()
  })

  inputValue.value = ''
  saveTodos()
}

function toggleTodo(id) {
  const item = items.value.find((i) => i.id === id)
  if (item) {
    item.completed = !item.completed
    saveTodos()
  }
}

function deleteTodo(id) {
  items.value = items.value.filter((i) => i.id !== id)
  saveTodos()
}

function saveTodos() {
  wsStore.updateWidget(props.id, { data: { items: items.value } })
}

watch(
  () => props.data?.items,
  (newItems) => {
    if (newItems) {
      items.value = newItems
    }
  }
)
</script>

<template>
  <div class="todo-widget">
    <div class="todo-input">
      <input v-model="inputValue" placeholder="Add a task..." @keydown.enter="addTodo" autofocus />
      <button @click="addTodo">+</button>
    </div>

    <div class="todo-list">
      <div
        v-for="item in items"
        :key="item.id"
        class="todo-item"
        :class="{ completed: item.completed }"
      >
        <input type="checkbox" :checked="item.completed" @change="toggleTodo(item.id)" />
        <span class="todo-text">{{ item.text }}</span>
        <button class="delete-btn" @click="deleteTodo(item.id)">×</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.todo-widget {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.todo-input {
  display: flex;
  gap: 8px;
}

.todo-input input {
  flex: 1;
  padding: 8px 12px;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  color: #cdc6f7;
  font-size: 13px;
  outline: none;
}

.todo-input button {
  width: 32px;
  height: 32px;
  background: rgba(124, 106, 255, 0.2);
  border: 1px solid rgba(124, 106, 255, 0.4);
  border-radius: 6px;
  color: #e8e4ff;
  font-size: 20px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.todo-input button:hover {
  background: rgba(124, 106, 255, 0.3);
}

.todo-list {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.todo-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 6px;
  transition: background 0.15s ease;
}

.todo-item:hover {
  background: rgba(0, 0, 0, 0.3);
}

.todo-item input[type='checkbox'] {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

.todo-text {
  flex: 1;
  color: #cdc6f7;
  font-size: 13px;
  line-height: 1.4;
}

.todo-item.completed .todo-text {
  text-decoration: line-through;
  opacity: 0.5;
}

.delete-btn {
  width: 24px;
  height: 24px;
  background: rgba(224, 108, 117, 0.15);
  border: 1px solid rgba(224, 108, 117, 0.3);
  border-radius: 4px;
  color: #e06c75;
  font-size: 18px;
  cursor: pointer;
  transition: all 0.15s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
}

.delete-btn:hover {
  background: rgba(224, 108, 117, 0.25);
}
</style>
