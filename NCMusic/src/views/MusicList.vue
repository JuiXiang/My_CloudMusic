<script setup lang="ts">
import { onMounted, ref, computed, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import api from "@/api";
import VirtualList from "@/components/VirtualList.vue";

const route = useRoute();
const router = useRouter();

const playlistId = computed(() => route.query.id);
const playlistName = ref("");
const tracks = ref<any[]>([]);
const loading = ref(false);

const formatDuration = (ms: number) => {
  if (!ms) return "00:00";
  const totalSec = Math.floor(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = (totalSec % 60).toString().padStart(2, "0");
  return `${min}:${sec}`;
};

const fetchPlaylistDetail = async () => {
  const id = playlistId.value;
  if (!id) return;
  loading.value = true;
  try {
    const res = await api.get("/playlist/detail", { params: { id } });
    const detail = res.playlist;
    if (detail) {
      playlistName.value = detail.name || "歌单";
      tracks.value =
        detail.tracks?.map((item: any) => ({
          id: item.id,
          name: item.name,
          artist: (item.ar || item.artist.name || [])
            .map((art: any) => art.name)
            .join("/"),
          durationMs: item.duration || item.dt || 0,
          album: (item.al || item.album)?.name || "",
        })) || [];
    }
  } catch (error) {
    console.log("获取歌单详情失败", error);
  } finally {
    loading.value = false;
  }
};

const handlePlaySong = (track: any, _index: number) => {
  if (!track?.id) return;
  router.push({ name: "player", query: { id: track.id } });
};

// 监听路由 id 变化，支持歌单间切换
watch(playlistId, () => {
  fetchPlaylistDetail();
});

onMounted(() => {
  fetchPlaylistDetail();
});
</script>

<template>
  <div class="musiclist-page">
    <div class="musiclist-inner">
      <h2 class="title">{{ playlistName }}</h2>
      <div v-if="loading" class="tip">歌曲加载中...</div>
      <div v-else-if="tracks.length === 0" class="tip">暂无歌曲</div>
      <VirtualList
        v-else
        :items="tracks"
        :item-height="42"
        :buffer="10"
        class="track-list"
        @item-click="handlePlaySong"
      >
        <template #default="{ item, index }">
          <div class="track-item">
            <span class="track-index">{{ index + 1 }}</span>
            <div class="track-main">
              <span class="track-name">{{ item.name }}</span>
              <span class="track-artist">{{ item.artist }}</span>
            </div>
            <div class="track-extra">
              <span class="track-album">{{ item.album }}</span>
              <span class="track-duration">{{ formatDuration(item.durationMs) }}</span>
            </div>
          </div>
        </template>
      </VirtualList>
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

.track-list {
  margin: 12px 0 0;
  border-radius: 8px;
  background: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  height: calc(100vh - 200px);
}

.track-item {
  display: flex;
  align-items: center;
  padding: 0 16px;
  height: 100%;
  box-sizing: border-box;
  border-bottom: 1px solid #f2f2f2;
  cursor: pointer;
  font-size: 13px;
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
