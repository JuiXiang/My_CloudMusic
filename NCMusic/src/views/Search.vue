<script setup lang="ts">
import { useRoute, useRouter } from "vue-router";
import { ref, onMounted ,computed ,watch} from "vue";
// @ts-ignore
import api from "@/api";

const route = useRoute();
const router = useRouter();

const songList = ref<any[]>([]);
const loading = ref(false);

const keyword = computed(() => (route.query.keyword  || '').toString());

// 时间格式化
const formatDuration = (ms: number) => {
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return `${minutes}:${seconds < 10 ? '0' + seconds : seconds}`;
};

// 点击播放事件
const handlePlay = (id: number) => {
  if (!id) return;
  router.push({
    name: "player",
    query: { id },
  });
};

const fetchSearchResult = async () => {
  const kw = keyword.value.trim();    
  songList.value = [];
  if (!kw) return;
  loading.value = true;
  try {
    const res = await api.get("/search", { params: { keywords: kw,limit:20 } });
    const songs = res.result?.songs || [];
    songList.value = songs.map((s:any)=>({
      id: s.id,
      name: s.name,
      artist: (s.artists || []).map((a:any)=>a.name).join('/'),
      album: s.album.name || '',
      durationMs: s.duration || 0,
    }));
  } catch (error) { 
    console.log("获取搜索结果失败", error);
  } finally {
    loading.value = false;
  }
}

// 监听路由参数变化
watch(
  () => route.query.keyword, 
  (newVal) => {
    if (newVal) {
      fetchSearchResult();
    }
});

onMounted(() => {
  fetchSearchResult();
  console.log(keyword.value);
})

</script>

<template>
  <div class="search-page">
    <div class="search-inner">
      <h2 class="title">搜索结果</h2>
      <p class="keyword" v-if="keyword">关键字：{{ keyword }}</p>
      <p class="tip" v-else>暂无关键字，请在顶部搜索框输入内容</p>

      <div v-if="loading"> 搜索结果中... </div>
      
      <div v-else-if="keyword && !songList.length" class="tip">
        未找到与{{ keyword }}相关的歌曲
      </div>

      <ul v-else class="song-list">
        <li 
          v-for="song in songList" 
          :key="song.id" class="song-item"
          @click="handlePlay(song.id)"
        >
          <div class="song-main">
            <span class="song-name">{{ song.name }}</span>
            <span class="song-artist">{{ song.artist }}</span>
          </div>
          <div class="song-extra">
            <span class="song-album">{{ song.album }}</span>
            <span class="song-duration">{{ formatDuration(song.durationMs) }}</span>
          </div>
        </li> 
      </ul>
    </div>
  </div>
</template>

<style scoped>

.search-page {
  min-height: calc(100vh - 90px);
  padding: 24px 32px;
  box-sizing: border-box;
}

.search-inner {
  max-width: 1200px;
  margin: 0 auto;
}

.title {
  margin: 0 0 12px;
  font-size: 20px;
  font-weight: 600;
}

.keyword {
  margin: 0 0 16px;
  font-size: 14px;
  color: #666;
}

.tip {
  margin-top: 24px;
  font-size: 14px;
  color: #888;
}

.song-list {
  margin: 16px 0 0;
  padding: 0;
  list-style: none;
  border-radius: 8px;
  background: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.song-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px;
  border-bottom: 1px solid #f2f2f2;
  cursor: pointer;
  font-size: 13px;
}

.song-item:last-of-type {
  border-bottom: none;
}

.song-item:hover {
  background: #fafafa;
}

.song-main {
  display: flex;
  flex-direction: column;
  max-width: 60%;
}

.song-name {
  font-size: 14px;
  color: #333;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.song-artist {
  margin-top: 2px;
  color: #999;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.song-extra {
  display: flex;
  align-items: center;
  gap: 16px;
  max-width: 40%;
  justify-content: flex-end;
}

.song-album {
  color: #666;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.song-duration {
  color: #999;
  flex-shrink: 0;
}

</style>