import { defineStore } from 'pinia'
import { ref , computed } from 'vue'

// 本地存储key
const STORAGE_KEY = "nc_user"

export const useUserStore = defineStore('user', () => {
  const user = ref(null)

  //判断是否已经登录
  const isLoggedIn = computed(() => !!user.value)

  //状态管理存储,不仅要在pinia,还要存储在本地存储
  const setUser = (payload) => {
    if(!payload) return
    const normalized = {
      id: payload.id || 0,
      nickname: payload.nickname,
      avatar: payload.avatar,
    }
    user.value = normalized
    localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized))
  }

  const clearUser = () => {
    user.value = null
    localStorage.removeItem(STORAGE_KEY)
  }

  // 从本地存储中获取用户信息
  const initFromLocal = () => {
    const raw = localStorage.getItem(STORAGE_KEY)
    if(!raw) return
    const parsed = JSON.parse(raw)
    if(parsed && parsed.id) {
      user.value = parsed
    }
  }

  initFromLocal()
  
  return {
    user,
    isLoggedIn,
    setUser,
    clearUser,
  }
})