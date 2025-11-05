<template>
  <div>
    <div 
      class="floating-button" 
      :style="{left: position.x + 'px', top: position.y + 'px'}"
      @mousedown="onMouseDown"
      @touchstart.prevent="onTouchStart"
      @click="togglePanel"
    >
      <img :src="iconUrl" alt="chat" />
    </div>

    <div v-if="open" class="panel-mask" @click.self="open=false">
      <div class="panel">
        <div class="panel-header">
          <span>智能图书助手</span>
          <button class="close-btn" @click="open=false">×</button>
        </div>
        <ChatBot />
      </div>
    </div>
  </div>
  
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import ChatBot from './ChatBot.vue'

const open = ref(false)
const position = ref({ x: 24, y: 200 })
const dragging = ref(false)
const offset = ref({ x: 0, y: 0 })
const start = ref({ x: 0, y: 0 })
const lastDragAt = ref(0)
const iconUrl = '/src/assets/images/deepseek.png'

const togglePanel = () => {
  // 阻止拖动结束后的“点击冒泡”误触
  if (Date.now() - lastDragAt.value < 200) return
  open.value = !open.value
}

const onMouseDown = (e: MouseEvent) => {
  dragging.value = false
  start.value = { x: e.clientX, y: e.clientY }
  offset.value = { x: e.clientX - position.value.x, y: e.clientY - position.value.y }
  window.addEventListener('mousemove', onMouseMove)
  window.addEventListener('mouseup', onMouseUp)
}

const onMouseMove = (e: MouseEvent) => {
  // 只有移动超过阈值才认为在拖动
  if (!dragging.value) {
    const dx = Math.abs(e.clientX - start.value.x)
    const dy = Math.abs(e.clientY - start.value.y)
    if (dx < 3 && dy < 3) return
    dragging.value = true
  }
  position.value = clampToViewport(e.clientX - offset.value.x, e.clientY - offset.value.y)
}

const onMouseUp = () => {
  if (dragging.value) lastDragAt.value = Date.now()
  dragging.value = false
  window.removeEventListener('mousemove', onMouseMove)
  window.removeEventListener('mouseup', onMouseUp)
}

const onTouchStart = (e: TouchEvent) => {
  dragging.value = false
  const t = e.touches[0]
  start.value = { x: t.clientX, y: t.clientY }
  offset.value = { x: t.clientX - position.value.x, y: t.clientY - position.value.y }
  window.addEventListener('touchmove', onTouchMove, { passive: false })
  window.addEventListener('touchend', onTouchEnd)
}

const onTouchMove = (e: TouchEvent) => {
  const t = e.touches[0]
  if (!dragging.value) {
    const dx = Math.abs(t.clientX - start.value.x)
    const dy = Math.abs(t.clientY - start.value.y)
    if (dx < 3 && dy < 3) return
    dragging.value = true
  }
  position.value = clampToViewport(t.clientX - offset.value.x, t.clientY - offset.value.y)
}

const onTouchEnd = () => {
  if (dragging.value) lastDragAt.value = Date.now()
  dragging.value = false
  window.removeEventListener('touchmove', onTouchMove)
  window.removeEventListener('touchend', onTouchEnd)
}

const clampToViewport = (x: number, y: number) => {
  const vw = window.innerWidth
  const vh = window.innerHeight
  const btn = 56
  const nx = Math.min(Math.max(8, x), vw - btn - 8)
  const ny = Math.min(Math.max(8, y), vh - btn - 8)
  return { x: nx, y: ny }
}

onMounted(() => {
  // 尝试从本地恢复位置
  try {
    const raw = localStorage.getItem('floating-chat-pos')
    if (raw) position.value = JSON.parse(raw)
  } catch {}
  window.addEventListener('resize', () => {
    position.value = clampToViewport(position.value.x, position.value.y)
  })
})

onBeforeUnmount(() => {
  try { localStorage.setItem('floating-chat-pos', JSON.stringify(position.value)) } catch {}
})
</script>

<style scoped>
.floating-button {
  position: fixed;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: transparent; /* 背景透明，仅显示图标 */
  box-shadow: none;
  cursor: grab;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}
.floating-button img{ width: 32px; height: 32px; pointer-events: none; filter: drop-shadow(0 2px 4px rgba(0,0,0,.25)); }

.panel-mask{
  position: fixed; inset: 0; background: rgba(0,0,0,0.2); z-index: 1000;
  display: flex; align-items: center; justify-content: center;
}
.panel{
  width: 900px; max-width: calc(100vw - 40px); height: 640px; max-height: calc(100vh - 40px);
  background: #fff; border-radius: 10px; overflow: hidden; display: flex; flex-direction: column;
}
.panel-header{
  height: 44px; display: flex; align-items: center; justify-content: space-between; padding: 0 12px; border-bottom: 1px solid #eee;
}
.close-btn{ border: none; background: transparent; font-size: 20px; cursor: pointer; }
</style>


