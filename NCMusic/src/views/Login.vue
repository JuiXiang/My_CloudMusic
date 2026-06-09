<script setup>

import { ref, onMounted ,watch,onBeforeUnmount} from 'vue';
import api from '@/api'
import { useUserStore } from '@/stores/user'
import {useRouter} from 'vue-router'


//路由管理
const router = useRouter()

//状态管理
const userStore = useUserStore()

//二维码图片
const qrImg = ref('');

//登录key
const loginKey = ref('');

//轮询定时器 二维码扫码定时器
const qrCheckTimer = ref(null);

//点击空白处关闭弹窗
const handleClickOverlayClick = (e) =>{
  if(e.target === e.currentTarget){
    router.push('/')
  }
}

//获取二维码登录key
const fetchLoginKey = async () =>{
  try{
    const res = await api.get("/login/qr/key",{
      params:{
        timestamp: Date.now(),
      }
    })  
    loginKey.value = res.data.unikey || ''
  } catch (error) {
    console.error("获取登录登录key失败:", error);
  }
}

//根据key生成二维码图片
const fetchImage = async (key) =>{
  try{
    const res = await api.get("/login/qr/create",{
      params:{
        key,
        timestamp: Date.now(),
        ua:"pc",
        qrimg:true
      }
    })
    qrImg.value = res.data?.qrimg || ''
  } catch (error) {
    console.error("生成二维码图片失败:", error);
  }
}

//监听是否获取到key，如果获取到key，就生成二维码图片
watch(
  () => loginKey.value,
  (val)=>{
    if(val){
      fetchImage(val)
    }
  }
)

//轮询二维码状态，成功后保存用户信息
const startQrCheck = async(key)=>{
  if(!key) return;
  if(qrCheckTimer.value){
    clearInterval(qrCheckTimer.value)
  }
  qrCheckTimer.value = setInterval(async()=>{
    try{
      const res = await api.get("/login/qr/check",{
        params:{
          key,
          timestamp:Date.now(),
          ua:"pc"
        }
      })
    //常见状态:800为二维码过期 801为等待扫码 802为待确认 803为授权登录成功
    if(res.code === 803){
      clearInterval(qrCheckTimer.value)
      qrCheckTimer.value = null

      //授权成功之后，再调用 登录状态 获取用户完整信息
      try{
        const statusRes = await api.get("/login/status",{
          params:{
            timestamp: Date.now(),
            ua:"pc"
          }
        })
        console.log(statusRes)
        const profile = statusRes.data?.profile || statusRes.profile || statusRes.account || {}
        console.log(profile)
        if(profile){
          //登录成功，保存用户信息
          userStore.setUser({
            id: profile.userId,
            nickname: profile.nickname,
            avatar: profile.avatarUrl,
          })
          //跳转到首页
          router.push('/')
        }
      } catch (error) {
        console.error("获取登录状态失败:", error);
      }
    }
    } catch (error) {
      console.error("检查二维码登录状态失败:", error);
    }
  }, 3000)
}

watch(
  () => qrImg.value,
  (val)=>{
    if(val&&loginKey.value){
      startQrCheck(loginKey.value)
    } 
  }
)

onMounted(() => {
  fetchLoginKey();
});

onBeforeUnmount(() => {
  if(qrCheckTimer.value){
    clearInterval(qrCheckTimer.value)
    qrCheckTimer.value = null
  }
})


</script>

<template>
  <div class="login-overlay" @click="handleClickOverlayClick">
    <div class="login-modal">
      <div class="login-header">
        <h2>扫码登录网易云音乐</h2>
        <p>使用网易云音乐 APP 扫码登录,更安全更便捷</p>
      </div>
      <div class="login-body">
        <div class="qrcode-box">
          <div cldiv="qrcode-placeholder">
            <template v-if="qrImg">
              <img :src="qrImg" alt="登录二维码" />
            </template>
            <template v-else>
              <span>二维码加载中...</span>
            </template>
          </div>
        <p class="qrcode-tip">打开网易云音乐 APP，扫一扫登录</p>
      </div>
        <ul class="login-features">
          <li>同步收藏的歌单、歌曲和播放记录</li>
          <li>多端同步，随时随地畅听音乐</li>
          <li>更安全的扫码登录方式</li>
        </ul>
      </div>  
    </div>
  </div>
</template>


<style scoped>
.login-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999;
}

.login-modal {
  width: 420px;
  padding: 24px 32px 32px;
  border-radius: 8px;
  background: #ffffff;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
  box-sizing: border-box;
}

.login-header h2 {
  margin: 0;
  font-size: 20px;
  color: #333;
}

.login-header p {
  margin: 8px 0 0;
  font-size: 13px;
  color: #666;
}

.login-body {
  margin-top: 20px;
  display: flex;
  gap: 20px;
}

.qrcode-box {
  text-align: center;
}

.qrcode-placeholder {
  width: 140px;
  height: 140px;
  border-radius: 4px;
  background: #f5f5f5;
  border: 1px solid #e1e1e1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #999;
  font-size: 14px;
}

.qrcode-placeholder img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.qrcode-tip {
  margin-top: 8px;
  font-size: 12px;
  color: #666;
}

.login-features {
  list-style: none;
  padding: 0;
  margin: 0;
  font-size: 13px;
  color: #555;
}

.login-features li + li {
  margin-top: 8px;
}
</style>