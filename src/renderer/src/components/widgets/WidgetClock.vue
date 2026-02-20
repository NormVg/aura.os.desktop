<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'

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
  font-size: 64px;
  /* Massive digital clock size */
  font-weight: 200;
  /* Ultra-light */
  color: #fff;
  background: transparent;
  /* Rely entirely on wrapper glass */
  font-family: 'Inter', sans-serif;
  letter-spacing: -0.02em;
  text-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
}
</style>
