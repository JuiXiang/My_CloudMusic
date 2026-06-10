<script setup>
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '@/api'
import { useVirtualList } from '@/hooks/useVirtualList'

const route = useRoute()
const router = useRouter()

const playlistId = computed(() => route.query.id)
const playlistName = ref('')
const tracks = ref([])
const loading = ref(false)

// 虚拟列表配置，设置每项固定高度 56px
const { containerRef, totalHeight, visibleList, offsetY, handleScroll } = useVirtualList(tracks, { itemHeight: 56, buffer: 10 })

const formatDuration = (ms) => {
  if (!ms) return '00:00'
  const totalSec = Math.floor(ms / 1000)
  const min = Math.floor(totalSec / 60)
  const sec = (totalSec % 60).toString().padStart(2, '0')
  return `${min}:${sec}`
}

const fetchPlaylistDetail = async (id) => {
  if (!id) {
    playlistName.value = ''
    tracks.value = []
    return
  }
  loading.value = true
  try {
    const res = await api.get('/playlist/detail', { params: { id } })
    const detail = res.playlist
    if (detail) {
      playlistName.value = detail.name || '歌单'
      tracks.value =
        detail.tracks?.map((item) => ({
          id: item.id,
          name: item.name,
          artist: (item.ar || item.artist.name || [])
            .map((art) => art.name)
            .join('/'),
          durationMs: item.duration || item.dt || 0,
          album: (item.al || item.album)?.name || '',
        })) || []
    }
  } catch (error) {
    console.log('获取歌单详情失败', error)
  } finally {
    loading.value = false
  }
}

const handlePlaySong = (id) => {
  if (!id) return
  router.push({ name: 'player', query: { id } })
}

watch(playlistId, (id) => {
  fetchPlaylistDetail(id)
}, { immediate: true })
</script>

<template>
  <div class="musiclist-page">
    <div class="musiclist-inner">
      <h2 class="title">{{ playlistName }}</h2>
      <div v-if="loading" class="tip">正在加载歌单详情...</div>
      <div v-else-if="tracks.length === 0" class="tip">暂无歌曲数据</div>
      <div v-else class="virtual-list-container" ref="containerRef" @scroll="handleScroll">
        <div class="virtual-list-phantom" :style="{ height: totalHeight + 'px' }"></div>
        <ul class="track-list" :style="{ transform: `translateY(${offsetY}px)` }">
          <li v-for="track in visibleList" :key="track.id" class="track-item"
            @click="handlePlaySong(track.id)"
          >
            <span class="track-index">{{ track._index + 1 }}</span>
            <div class="track-main">
              <span class="track-name">{{ track.name }}</span>
              <span class="track-artist">{{ track.artist }}</span>
            </div>
            <div class="track-extra">
              <span class="track-album">{{ track.album }}</span>
              <span class="track-duration">{{ formatDuration(track.durationMs) }}</span>
            </div>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<style scoped>
.musiclist-page {
  min-height: calc(100vh - 90px);
  padding: 24px 32px;
  box-sizing: border-box;
}

.musiclist-inner {
  max-width: 1200px;
  margin: 0 auto;
}

.title {
  margin: 0 0 16px;
  font-size: 20px;
  font-weight: 600;
}

.tip {
  margin-top: 16px;
  font-size: 14px;
  color: #777;
}

.virtual-list-container {
  position: relative;
  height: calc(100vh - 200px);
  overflow-y: auto;
  border-radius: 8px;
  background: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.virtual-list-phantom {
  position: absolute;
  left: 0;
  top: 0;
  right: 0;
  z-index: -1;
}

.track-list {
  position: absolute;
  left: 0;
  top: 0;
  right: 0;
  margin: 0;
  padding: 0;
  list-style: none;
}

.track-item {
  display: flex;
  align-items: center;
  padding: 8px 16px;
  border-bottom: 1px solid #f2f2f2;
  cursor: pointer;
  font-size: 13px;
  height: 56px;
  box-sizing: border-box;
}

.track-item:last-of-type {
  border-bottom: none;
}

.track-item:hover {
  background: #fafafa;
}

.track-index {
  width: 32px;
  text-align: right;
  margin-right: 12px;
  color: #999;
  flex-shrink: 0;
}

.track-main {
  display: flex;
  flex-direction: column;
  max-width: 50%;
}

.track-name {
  font-size: 14px;
  color: #333;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.track-artist {
  margin-top: 2px;
  color: #999;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.track-extra {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-left: auto;
  max-width: 40%;
}

.track-album {
  color: #666;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.track-duration {
  color: #999;
  flex-shrink: 0;
}
</style>
