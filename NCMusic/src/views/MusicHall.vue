<script setup lang="ts">
// @ts-ignore 忽略JS模块的类型检查，解决隐式any类型报错
import api from "@/api/index.js";
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";

const router = useRouter();
//推荐的歌单
const playlists = ref<any[]>([]);
//推荐的新音乐
const newSongs = ref<any[]>([]);
// 歌手榜单
const singerRank = ref<any[]>([]);
//当前展示的歌手轮播图的索引
const currentSingerSlide = ref(0);
//默认每个轮播图展示的歌手数量
const SINGER_PAGE_SIZE = 5;

//处理每个轮播图的数据
const singerSlides = computed(() => {
  //list为每一页的五条数据
  const list = singerRank.value || [];
  //所有轮播图的页数的数据
  const slides = [];
  for (let i = 0; i < list.length; i += SINGER_PAGE_SIZE) {
    slides.push(list.slice(i, i + SINGER_PAGE_SIZE));
  }
  return slides;
});

// 左右切换按钮事件
const prevSingerSlide = () => {
  if (!singerSlides.value.length) return;
  currentSingerSlide.value =
    (currentSingerSlide.value - 1 + singerSlides.value.length) %
    singerSlides.value.length;
};

const nextSingerSlide = () => {
  if (!singerSlides.value.length) return;
  currentSingerSlide.value =
    (currentSingerSlide.value + 1) % singerSlides.value.length;
};
const fetchPlaylist = async () => {
  try {
    const res = await api.get("/personalized", { params: { limit: 5 } });
    playlists.value = (res.result || []).map((item: any) => ({
      id: item.id,
      title: item.name,
      desc: item.copywriter || "",
      cover: item.picUrl,
    }));
    // console.log(playlists.value)
  } catch (error) {
    console.log("获取歌单失败: ", error);
  }
};

const fetchNewSongs = async () => {
  try {
    const res = await api.get("/personalized/newsong");
    newSongs.value = (res.result || []).map((item: any) => ({
      id: item.id,
      name: item.name,
      cover: item.picUrl,
      artist: item.song?.artists?.map((a: any) => a.name).join("/") || "",
    }));
    // console.log(res)
  } catch (error) {
    console.log("获取新音乐失败", error);
  }
};

const fetchSingerRank = async () => {
  try {
    const res = await api.get("/top/artists", { params: { limit: 20 } });
    singerRank.value = (res.artists || []).map(
      (artist: any, index: number) => ({
        id: artist.id,
        name: artist.name,
        rank: index + 1,
        avatar: artist.picUrl,
      }),
    );
    console.log(singerRank.value);
  } catch (error) {
    console.log("获取热门歌手失败", error);
  }
};
onMounted(() => {
  fetchPlaylist();
  fetchNewSongs();
  fetchSingerRank();
});
// 点击歌单事件
const handlePlaylistClick = (id: number) => {
  if (!id) return;
  router.push({
    name: "musiclist",
    query: { id },
  });
};
</script>

<template>
  <div class="hall-wrapper">
    <div class="hall-inner">
      <!-- 推荐歌单 -->
      <h2 class="section-title">推荐歌单</h2>
      <ul class="playlist-list">
        <li
          v-for="item in playlists"
          :key="item.id"
          class="playlist-item"
          @click="handlePlaylistClick(item.id)"
        >
          <div class="cover-wrapper">
            <img :src="item.cover" :alt="item.title" />
          </div>
          <div class="info">
            <p class="title">{{ item.title }}</p>
            <p class="desc">{{ item.desc }}</p>
          </div>
        </li>
      </ul>
      <!-- 推荐的新音乐   -->
      <h2 class="section-title section-title--sub">推荐的新音乐</h2>
      <ul class="song-list">
        <li class="song-item" v-for="song in newSongs" :key="song.id">
          <div class="song-cover">
            <img :src="song.cover" :alt="song.name" />
          </div>
          <div class="song-info">
            <p class="song-name">{{ song.name }}</p>
            <p class="song-artist">{{ song.artist }}</p>
          </div>
        </li>
      </ul>
      <!-- 歌手榜单 -->
      <h2 class="section-title section-title--singer section-title--sub">
        歌手榜单
      </h2>
      <div class="singer-carousel" v-if="singerSlides.length">
        <div class="singer-carousel-track">
          <div
            v-for="(slide, index) in singerSlides"
            :key="index"
            class="singer-slide"
            v-show="index == currentSingerSlide"
          >
            <ul class="singer-list">
              <li v-for="singer in slide" :key="singer.id" class="singer-item">
                <div class="singer-avatar">
                  <img :src="singer.avatar" :alt="singer.name" />
                </div>
                <span class="singer-name">
                  <p class="name">{{ singer.rank }} {{ singer.name }}</p>
                </span>
              </li>
            </ul>
          </div>
        </div>
        <!-- 左右按钮 -->
        <div class="singer-carousel-controls" v-if="singerSlides.length > 1">
          <button class="singer-arrow" @click="prevSingerSlide">‹</button>
          <button class="singer-arrow" @click="nextSingerSlide">›</button>
        </div>
      </div>
    </div>
  </div>
  <div></div>
</template>
<style scoped>
.hall-wrapper {
  display: flex;
  justify-content: center;
}

.hall-inner {
  width: 100%;
  max-width: 1200px;
}

.section-title {
  margin: 0 0 16px;
  margin-top: 40px;
  font-size: 20px;
  font-weight: 600;
  color: #333;
}

.section-title--sub {
  margin-top: 40px;
}

.section-title--singer {
  margin-top: 68px;
  font-size: 22px;
  text-align: center;
}

.playlist-list {
  display: flex;
  gap: 20px;
  list-style: none;
  padding: 0;
  margin: 0;
}

.playlist-item {
  flex: 1;
  max-width: 220px;
  cursor: pointer;
}

.cover-wrapper {
  width: 100%;
  aspect-ratio: 1 / 1;
  border-radius: 4px;
  overflow: hidden;
  background: #eee;
  cursor: pointer;
}

.cover-wrapper img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  transition: transform 0.3s ease;
}

.cover-wrapper:hover img {
  transform: scale(1.06);
}

.info {
  margin-top: 8px;
}

.title {
  font-size: 14px;
  color: #333;
  margin: 0 0 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.desc {
  font-size: 12px;
  color: #999;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.song-list {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px 40px;
  list-style: none;
  padding: 0;
  margin: 0;
}

.song-item {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
}

.song-cover {
  width: 82px;
  height: 82px;
  border-radius: 4px;
  overflow: hidden;
  background: #eee;
  flex-shrink: 0;
  cursor: pointer;
}

.song-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  transition: transform 0.3s ease;
}

.song-cover:hover img {
  transform: scale(1.2);
}

.song-info {
  flex: 1;
}

.song-name {
  font-size: 14px;
  color: #333;
  margin: 0 0 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.song-artist {
  font-size: 12px;
  color: #999;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.singer-list {
  margin: 16px 0 0;
  padding: 0;
  list-style: none;
  display: flex;
  justify-content: space-between;
}

.singer-item {
  width: 20%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.singer-avatar {
  width: 160px;
  height: 160px;
  border-radius: 50%;
  overflow: hidden;
  background: #eee;
  flex-shrink: 0;
}

.singer-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.singer-name {
  font-size: 16px;
  color: #333;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.singer-carousel {
  margin-top: 12px;
  position: relative;
}

.singer-carousel-track {
  position: relative;
  min-height: 200px;
}

.singer-slide {
  width: 100%;
}

.singer-carousel-controls {
  position: absolute;
  inset: 0;
  margin: 0;
  pointer-events: none;
}

.singer-arrow {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 44px;
  height: 44px;
  border-radius: 50%;
  border: none;
  background: #f2f2f2;
  cursor: pointer;
  font-size: 22px;
  line-height: 1;
  pointer-events: auto;
}

.singer-arrow:first-of-type {
  left: -30px;
}

.singer-arrow:last-of-type {
  right: -30px;
}

.singer-arrow:hover {
  background: #e5e5e5;
}
</style>
