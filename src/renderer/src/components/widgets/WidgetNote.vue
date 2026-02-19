<script setup>
import { ref, watch } from 'vue'
import { useWorkspaceStore } from '../../stores/workspaces'

const props = defineProps(['id', 'data'])
const wsStore = useWorkspaceStore()
const content = ref(props.data?.content || '')

let timer = null
function onInput() {
  clearTimeout(timer)
  timer = setTimeout(() => {
    wsStore.updateWidget(props.id, { data: { content: content.value } })
  }, 500)
}
</script>

<template>
  <div class="note-widget">
    <textarea v-model="content" placeholder="Type a note..." @input="onInput"></textarea>
  </div>
</template>

<style scoped>
.note-widget {
  width: 100%;
  height: 100%;
  background: rgba(30, 30, 34, 0.6);
  color: #eee;
  display: flex;
  flex-direction: column;
}

textarea {
  flex: 1;
  width: 100%;
  height: 100%;
  background: transparent;
  border: none;
  resize: none;
  padding: 16px;
  color: inherit;
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  line-height: 1.5;
  outline: none;
}

textarea::placeholder {
  color: rgba(255, 255, 255, 0.3);
}
</style>
