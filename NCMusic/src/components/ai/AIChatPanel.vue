<script setup>
import { ref, computed, nextTick, watch, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAIStore } from '@/stores/ai'
import { chatWithAI } from '@/api/ai'
import { getSearch } from '@/api/search'

const aiStore = useAIStore()
const router = useRouter()
const inputMsg = ref('')
const msgListRef = ref(null)

// --- 拖拽与缩放状态 ---
const panelRef = ref(null)
const isDragging = ref(false)
const isResizing = ref(false)

const panelStyle = ref({
  width: 380,
  height: 600,
  left: 0,
  top: 0
})

const windowSize = ref({
  width: window.innerWidth,
  height: window.innerHeight
})

// 关闭时的隐藏偏移
const panelTransform = computed(() => {
  if (aiStore.isOpen) return 'none'
  return `translate(${windowSize.value.width - panelStyle.value.left}px, ${windowSize.value.height - panelStyle.value.top}px) scale(0.8)`
})

// 拖拽相关
let dragStartX = 0
let dragStartY = 0
let initialLeft = 0
let initialTop = 0

// 缩放相关
let resizeStartX = 0
let resizeStartY = 0
let initialWidth = 0
let initialHeight = 0
let resizeDirection = ''

const scrollToBottom = async () => {
  await nextTick()
  if (msgListRef.value) {
    msgListRef.value.scrollTop = msgListRef.value.scrollHeight
  }
}

watch(() => aiStore.messages, () => {
  scrollToBottom()
}, { deep: true })

watch(() => aiStore.isOpen, (newVal) => {
  if (newVal) {
    scrollToBottom()
  }
})

// --- 拖拽逻辑 ---
const startDrag = (e) => {
  if (e.target.closest('.close-btn')) return

  isDragging.value = true
  dragStartX = e.clientX
  dragStartY = e.clientY
  initialLeft = panelStyle.value.left
  initialTop = panelStyle.value.top

  document.addEventListener('mousemove', onDrag)
  document.addEventListener('mouseup', stopDrag)
  e.preventDefault()
}

const onDrag = (e) => {
  if (!isDragging.value) return

  const dx = e.clientX - dragStartX
  const dy = e.clientY - dragStartY

  let newLeft = initialLeft + dx
  let newTop = initialTop + dy

  const maxX = window.innerWidth - panelStyle.value.width
  const maxY = window.innerHeight - panelStyle.value.height

  newLeft = Math.max(0, Math.min(newLeft, maxX))
  newTop = Math.max(0, Math.min(newTop, maxY))

  panelStyle.value.left = newLeft
  panelStyle.value.top = newTop
}

const stopDrag = () => {
  isDragging.value = false
  document.removeEventListener('mousemove', onDrag)
  document.removeEventListener('mouseup', stopDrag)
}

// --- 缩放逻辑 ---
const startResize = (e, direction) => {
  isResizing.value = true
  resizeDirection = direction
  resizeStartX = e.clientX
  resizeStartY = e.clientY
  initialWidth = panelStyle.value.width
  initialHeight = panelStyle.value.height
  initialLeft = panelStyle.value.left
  initialTop = panelStyle.value.top

  document.addEventListener('mousemove', onResize)
  document.addEventListener('mouseup', stopResize)
  e.stopPropagation()
  e.preventDefault()
}

const onResize = (e) => {
  if (!isResizing.value) return

  const dx = e.clientX - resizeStartX
  const dy = e.clientY - resizeStartY

  let newWidth = initialWidth
  let newHeight = initialHeight
  let newLeft = initialLeft
  let newTop = initialTop

  const minWidth = 320
  const minHeight = 400

  if (resizeDirection.includes('e')) {
    newWidth = Math.max(minWidth, initialWidth + dx)
    if (newLeft + newWidth > window.innerWidth) {
      newWidth = window.innerWidth - newLeft
    }
  }
  if (resizeDirection.includes('s')) {
    newHeight = Math.max(minHeight, initialHeight + dy)
    if (newTop + newHeight > window.innerHeight) {
      newHeight = window.innerHeight - newTop
    }
  }
  if (resizeDirection.includes('w')) {
    newWidth = Math.max(minWidth, initialWidth - dx)
    if (newWidth > minWidth) {
      newLeft = initialLeft + dx
    }
  }
  if (resizeDirection.includes('n')) {
    newHeight = Math.max(minHeight, initialHeight - dy)
    if (newHeight > minHeight) {
      newTop = initialTop + dy
    }
  }

  panelStyle.value.width = newWidth
  panelStyle.value.height = newHeight
  panelStyle.value.left = newLeft
  panelStyle.value.top = newTop
}

const stopResize = () => {
  isResizing.value = false
  document.removeEventListener('mousemove', onResize)
  document.removeEventListener('mouseup', stopResize)
}

const handleWindowResize = () => {
  windowSize.value.width = window.innerWidth
  windowSize.value.height = window.innerHeight

  const maxX = window.innerWidth - panelStyle.value.width
  const maxY = window.innerHeight - panelStyle.value.height

  if (panelStyle.value.left > maxX) panelStyle.value.left = Math.max(0, maxX)
  if (panelStyle.value.top > maxY) panelStyle.value.top = Math.max(0, maxY)
}

onMounted(() => {
  panelStyle.value.left = window.innerWidth - panelStyle.value.width - 32
  panelStyle.value.top = window.innerHeight - panelStyle.value.height - 32

  window.addEventListener('resize', handleWindowResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleWindowResize)
  stopDrag()
  stopResize()
})

// AI 推荐歌曲 → 搜索真实曲目 ID
const fetchRealSongs = async (aiSongs) => {
  const searchPromises = aiSongs.map(async (song) => {
    try {
      const keyword = `${song.name} ${song.artist || ''}`.trim()
      const res = await getSearch(keyword, 1)
      const resultSong = res.result?.songs?.[0]
      if (resultSong) {
        return {
          id: resultSong.id,
          name: resultSong.name,
          artists: resultSong.artists.map(ar => ar.name).join(', '),
          album: resultSong.album.name || '',
          reason: song.reason
        }
      }
    } catch (e) {
      console.error('搜索歌曲失败:', e)
    }
    return null
  })

  const results = await Promise.all(searchPromises)
  return results.filter(item => item !== null)
}

const handleSend = async () => {
  const msg = inputMsg.value.trim()
  if (!msg || aiStore.isLoading) return

  inputMsg.value = ''

  aiStore.addMessage({ role: 'user', type: 'text', content: msg })

  aiStore.isLoading = true
  try {
    const history = aiStore.getChatHistory()
    const response = await chatWithAI(history)

    if (response.type === 'recommendation') {
      const realSongs = await fetchRealSongs(response.songs)
      aiStore.addMessage({
        role: 'assistant',
        type: 'recommendation',
        text: response.text,
        songs: realSongs,
        content: response.content
      })
    } else {
      aiStore.addMessage({
        role: 'assistant',
        type: response.type || 'text',
        content: response.content
      })
    }
  } catch (error) {
    console.error('发送消息失败:', error)
  } finally {
    aiStore.isLoading = false
  }
}

const playSong = (id) => {
  router.push({
    name: 'player',
    query: { id }
  })
}
</script>

<template>
  <div
    class="ai-panel"
    :class="{ 'is-open': aiStore.isOpen, 'is-dragging': isDragging, 'is-resizing': isResizing }"
    :style="{
      width: panelStyle.width + 'px',
      height: panelStyle.height + 'px',
      left: panelStyle.left + 'px',
      top: panelStyle.top + 'px',
      transform: panelTransform
    }"
    ref="panelRef"
  >
    <!-- 缩放控制柄 -->
    <div class="resize-handle n" @mousedown="startResize($event, 'n')"></div>
    <div class="resize-handle s" @mousedown="startResize($event, 's')"></div>
    <div class="resize-handle e" @mousedown="startResize($event, 'e')"></div>
    <div class="resize-handle w" @mousedown="startResize($event, 'w')"></div>
    <div class="resize-handle nw" @mousedown="startResize($event, 'nw')"></div>
    <div class="resize-handle ne" @mousedown="startResize($event, 'ne')"></div>
    <div class="resize-handle sw" @mousedown="startResize($event, 'sw')"></div>
    <div class="resize-handle se" @mousedown="startResize($event, 'se')"></div>

    <div class="panel-header" @mousedown="startDrag">
      <h3>智能音乐助手</h3>
      <button class="close-btn" @click="aiStore.togglePanel">&times;</button>
    </div>

    <div class="msg-list" ref="msgListRef">
      <div
        v-for="(msg, index) in aiStore.messages"
        :key="index"
        class="msg-item"
        :class="msg.role === 'user' ? 'msg-user' : 'msg-ai'"
      >
        <div class="msg-avatar">{{ msg.role === 'user' ? '我' : 'AI' }}</div>

        <!-- 文本消息 -->
        <div class="msg-content" v-if="msg.type === 'text' || msg.type === 'error'">
          <pre>{{ msg.content }}</pre>
        </div>

        <!-- 推荐歌曲列表 -->
        <div class="msg-content recommendation-content" v-else-if="msg.type === 'recommendation'">
          <p class="rec-text">{{ msg.text }}</p>
          <div class="rec-songs" v-if="msg.songs && msg.songs.length > 0">
            <div
              class="rec-song-card"
              v-for="song in msg.songs"
              :key="song.id"
              @click="playSong(song.id)"
            >
              <div class="song-info">
                <span class="song-name">{{ song.name }}</span>
                <span class="song-artist">- {{ song.artists }}</span>
              </div>
              <div class="song-reason" v-if="song.reason">"{{ song.reason }}"</div>
              <div class="play-icon">&#9654;</div>
            </div>
          </div>
          <div v-else class="rec-empty">未能找到匹配的真实歌曲资源</div>
        </div>
      </div>

      <div v-if="aiStore.isLoading" class="msg-item msg-ai">
        <div class="msg-avatar">AI</div>
        <div class="msg-content loading-dots">
          <span>.</span><span>.</span><span>.</span>
        </div>
      </div>
    </div>

    <div class="panel-footer">
      <textarea
        v-model="inputMsg"
        placeholder="输入你的想法，按 Enter 发送 (Shift+Enter 换行)..."
        @keydown.enter.exact.prevent="handleSend"
      ></textarea>
      <button class="send-btn" :disabled="aiStore.isLoading || !inputMsg.trim()" @click="handleSend">
        发送
      </button>
    </div>
  </div>

  <!-- 悬浮触发按钮 -->
  <div class="ai-trigger-btn" v-if="!aiStore.isOpen" @click="aiStore.togglePanel">
    <span class="icon">&#10024;</span>
  </div>
</template>

<style scoped>
.ai-trigger-btn {
  position: fixed;
  right: 32px;
  bottom: 32px;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: linear-gradient(135deg, #ff4b2b, #ff416c);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  cursor: pointer;
  box-shadow: 0 4px 16px rgba(255, 65, 108, 0.4);
  z-index: 100;
  transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.ai-trigger-btn:hover {
  transform: scale(1.1);
}

.ai-panel {
  position: fixed;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
  z-index: 101;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.3s ease, transform 0.3s cubic-bezier(0.165, 0.84, 0.44, 1);
}

.ai-panel.is-open {
  opacity: 1;
  pointer-events: auto;
}

.ai-panel.is-dragging,
.ai-panel.is-resizing {
  transition: none;
  user-select: none;
}

/* 缩放控制柄 */
.resize-handle {
  position: absolute;
  z-index: 10;
}
.resize-handle.n { top: -4px; left: 8px; right: 8px; height: 8px; cursor: ns-resize; }
.resize-handle.s { bottom: -4px; left: 8px; right: 8px; height: 8px; cursor: ns-resize; }
.resize-handle.e { right: -4px; top: 8px; bottom: 8px; width: 8px; cursor: ew-resize; }
.resize-handle.w { left: -4px; top: 8px; bottom: 8px; width: 8px; cursor: ew-resize; }
.resize-handle.nw { top: -4px; left: -4px; width: 12px; height: 12px; cursor: nwse-resize; }
.resize-handle.ne { top: -4px; right: -4px; width: 12px; height: 12px; cursor: nesw-resize; }
.resize-handle.sw { bottom: -4px; left: -4px; width: 12px; height: 12px; cursor: nesw-resize; }
.resize-handle.se { bottom: -4px; right: -4px; width: 12px; height: 12px; cursor: nwse-resize; }

.panel-header {
  padding: 16px 20px;
  border-bottom: 1px solid #f0f0f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: linear-gradient(135deg, #fff6f6, #fff);
  border-radius: 16px 16px 0 0;
  cursor: grab;
}

.panel-header:active {
  cursor: grabbing;
}

.panel-header h3 {
  margin: 0;
  font-size: 16px;
  color: #333;
  font-weight: 600;
  pointer-events: none;
}

.close-btn {
  background: transparent;
  border: none;
  font-size: 24px;
  color: #999;
  cursor: pointer;
  line-height: 1;
}

.close-btn:hover {
  color: #333;
}

.msg-list {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  background: #fafafa;
}

.msg-item {
  display: flex;
  gap: 12px;
  max-width: 90%;
}

.msg-user {
  align-self: flex-end;
  flex-direction: row-reverse;
}

.msg-ai {
  align-self: flex-start;
}

.msg-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: bold;
  color: #fff;
  flex-shrink: 0;
}

.msg-user .msg-avatar {
  background: #333;
}

.msg-ai .msg-avatar {
  background: linear-gradient(135deg, #ff4b2b, #ff416c);
}

.msg-content {
  background: #fff;
  padding: 12px 16px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  font-size: 14px;
  line-height: 1.6;
  color: #333;
}

.msg-user .msg-content {
  background: #333;
  color: #fff;
  border-top-right-radius: 4px;
}

.msg-ai .msg-content {
  border-top-left-radius: 4px;
}

.msg-content pre {
  margin: 0;
  white-space: pre-wrap;
  word-wrap: break-word;
  font-family: inherit;
}

/* 推荐卡片 */
.recommendation-content {
  padding: 12px;
  width: 260px;
}

.rec-text {
  margin: 0 0 12px;
  font-size: 14px;
  color: #333;
}

.rec-songs {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.rec-song-card {
  background: #f8f9fa;
  border: 1px solid #eee;
  border-radius: 8px;
  padding: 10px;
  cursor: pointer;
  position: relative;
  transition: all 0.2s;
}

.rec-song-card:hover {
  background: #fff;
  border-color: #ff416c;
  box-shadow: 0 2px 8px rgba(255, 65, 108, 0.1);
}

.rec-song-card:active {
  transform: scale(0.98);
  background: #f0f0f0;
}

.song-info {
  display: flex;
  align-items: baseline;
  gap: 6px;
  margin-bottom: 4px;
  padding-right: 24px;
}

.song-name {
  font-weight: 600;
  color: #333;
  font-size: 14px;
}

.song-artist {
  color: #666;
  font-size: 12px;
}

.song-reason {
  font-size: 12px;
  color: #888;
  font-style: italic;
  line-height: 1.4;
}

.play-icon {
  position: absolute;
  right: 12px;
  top: 12px;
  color: #ff416c;
  font-size: 14px;
  opacity: 0;
  transition: opacity 0.2s;
}

.rec-song-card:hover .play-icon {
  opacity: 1;
}

.rec-empty {
  color: #999;
  font-size: 12px;
  text-align: center;
  padding: 10px;
}

.panel-footer {
  padding: 16px;
  border-top: 1px solid #f0f0f0;
  display: flex;
  gap: 12px;
  background: #fff;
  border-radius: 0 0 16px 16px;
}

.panel-footer textarea {
  flex: 1;
  height: 40px;
  max-height: 120px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 10px 12px;
  font-size: 14px;
  resize: none;
  outline: none;
  font-family: inherit;
}

.panel-footer textarea:focus {
  border-color: #ff416c;
}

.send-btn {
  padding: 0 20px;
  background: #ff416c;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
}

.send-btn:hover:not(:disabled) {
  background: #ff4b2b;
}

.send-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.loading-dots span {
  animation: loading 1.4s infinite ease-in-out both;
  font-size: 18px;
  font-weight: bold;
}

.loading-dots span:nth-child(1) { animation-delay: -0.32s; }
.loading-dots span:nth-child(2) { animation-delay: -0.16s; }

@keyframes loading {
  0%, 80%, 100% { opacity: 0; }
  40% { opacity: 1; }
}
</style>
