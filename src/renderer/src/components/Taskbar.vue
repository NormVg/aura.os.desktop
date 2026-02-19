<template>
  <div class="taskbar">
    <slot />
  </div>
</template>

<style scoped>
.taskbar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 10px;
  background: linear-gradient(180deg, #1c1b23 0%, #19181f 100%);
  border-top: 1px solid rgba(255, 255, 255, 0.04);
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  padding: 0 16px;
  z-index: 101;
  user-select: none;
}
</style>
