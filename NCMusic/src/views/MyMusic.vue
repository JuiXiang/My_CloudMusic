<script setup lang="ts">
import { computed,ref,onMounted } from "vue";
// @ts-ignore
import { useUserStore } from "@/stores/user";
import { useRouter } from "vue-router";
// @ts-ignore
import api from "@/api";

const userStore = useUserStore()
const router = useRouter()

const playlists = ref<any[]>([])

// 网络请求，获取用户歌单
const fetchUserPlaylists = async () => {
  try {
    const uid = userStore.user?.id;
    if (!uid) return;
    const res = await api.get("/user/playlist",{params:{uid}});
    playlists.value = res.playlist?.map((item:any)=>({
        id:item.id,
        name:item.name,
        trackCount:item.trackCount,
        cover:item.coverImgUrl,
    })) || []
  } catch (error) {
    console.log("获取用户歌单失败", error);
  }
};

const handleGoLogin = () => {
    router.push({name:'login'})
}

const handleOpenPlaylist = (id:number) => {
    if(!id) return
    router.push({name:'musiclist',query:{id}})
}

onMounted(() => {
  fetchUserPlaylists();
});

</script>


<template>
  <div class="mymusic-page">
    <div class="mymusic-inner">
        <h2 class="title">我的音乐</h2>
        <!-- 判断用户是否登录 -->
        <div v-if="!userStore.isLoggedIn" class="login-hint">
            <p class="hint-text">您还未登录，请先登录后查看个人歌单</p>
            <button class="hint-btn " type="button" @click="handleGoLogin">登录</button>
        </div>
        <!-- 登录后显示用户歌单 -->
        <div v-else>
            <p class="subtitle">我的歌单</p>
            <div v-if="playlists.length===0" class="tip">暂无歌单，快去音乐馆收藏一些音乐吧</div>
            <ul v-else class="playlist-list">    
                <li v-for="item in playlists" 
                  :key="item.id" 
                  class="playlist-item"
                  @click="handleOpenPlaylist(item.id)"
                >
                  <div class="cover">
                    <img :src="item.cover" alt="歌单封面">        
                  </div>
                  <div class="info">
                    <p class="name">{{ item.name }}</p>
                    <p class="count">共{{ item.trackCount }}首</p>
                  </div> 
                </li>
            </ul>
        </div>
    </div>
  </div>  
</template>

<style scoped>
.mymusic-page {
  min-height: calc(100vh - 90px);
  padding: 24px 32px;
  box-sizing: border-box;
}

.mymusic-inner {
  max-width: 1200px;
  margin: 0 auto;
}

.title {
  margin: 0 0 16px;
  font-size: 20px;
  font-weight: 600;
}

.subtitle {
  margin: 0 0 12px;
  font-size: 16px;
  color: #333;
}

.login-hint {
  margin-top: 24px;
  padding: 24px 28px;
  border-radius: 8px;
  background: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.hint-text {
  margin: 0 0 12px;
  font-size: 14px;
  color: #555;
}

.hint-btn {
  padding: 6px 16px;
  border-radius: 16px;
  border: none;
  background: #c20c0c;
  color: #fff;
  font-size: 14px;
  cursor: pointer;
}

.hint-btn:hover {
  background: #a00a0a;
}

.tip {
  margin-top: 16px;
  font-size: 14px;
  color: #777;
}

.playlist-list {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
  list-style: none;
  margin: 12px 0 0;
  padding: 0;
}

.playlist-item {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  overflow: hidden;
}

.cover {
  width: 100%;
  aspect-ratio: 1/1;
  overflow: hidden;
}

.cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.info {
  padding: 8px 10px 10px;
}

.name {
  margin: 0 0 4px;
  font-size: 14px;
  color: #333;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.count {
  margin: 0;
  font-size: 12px;
  color: #999;
}
</style>