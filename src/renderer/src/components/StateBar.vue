<script setup>
// StateBar: slot container that shrink-wraps its content and animates on mount/unmount
</script>

<template>
  <div class="state-bar">
    <slot />
    <div class="curve-right" />
  </div>
</template>

<style scoped>
.state-bar {
  position: fixed;
  bottom: 10px;
  left: 0;
  background: linear-gradient(180deg, #27252f 0%, #1c1b23 100%);
  border-top: 1px solid rgba(255, 255, 255, 0.05);
  border-right: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 0 16px 0 0;
  z-index: 100;
  user-select: none;
  overflow: visible;
  box-shadow:
    4px -4px 24px rgba(0, 0, 0, 0.4),
    0 0 0 1px rgba(255, 255, 255, 0.03) inset;
}

.curve-right {
  position: absolute;
  bottom: 0;
  right: -16px;
  width: 16px;
  height: 16px;
  background: radial-gradient(circle at 100% 0, transparent 16px, #1e1e20 16px);
  pointer-events: none;
}
</style>
