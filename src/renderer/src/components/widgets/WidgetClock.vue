<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const time = ref('')
let timer = null

function update() {
  const d = new Date()
  time.value = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

onMounted(() => {
  update()
  timer = setInterval(update, 1000)
})

onUnmounted(() => clearInterval(timer))
</script>

<template>
  <div class="clock-widget">
    {{ time }}
  </div>
</template>

<style scoped>
.clock-widget {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32px;
  font-weight: 300;
  color: #fff;
  background: rgba(30, 30, 34, 0.4);
  font-family: 'Inter', sans-serif;
  letter-spacing: 0.05em;
}
</style>
