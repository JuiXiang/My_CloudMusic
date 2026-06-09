import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useAIStore = defineStore('ai', () => {
  const isOpen = ref(false)
  const isLoading = ref(false)
  const messages = ref([
    {
      role: 'assistant',
      type: 'text',
      content: '你好！我是你的智能音乐助手 🎵\n\n你可以告诉我你现在的心情、想听的风格，或者让我帮你推荐几首歌。例如：\n- 推荐几首适合深夜一个人听的歌\n- 帮我生成一个适合跑步的歌单\n- 介绍一下周杰伦的风格'
    }
  ])

  const togglePanel = () => {
    isOpen.value = !isOpen.value
  }

  const addMessage = (msg) => {
    messages.value.push(msg)
  }

  const getChatHistory = () => {
    const validMessages = messages.value.filter((msg, index) => index > 0)
    const recentMessages = validMessages.slice(-20)

    return recentMessages.map(msg => ({
      role: msg.role,
      content: msg.type === 'recommendation' ? msg.content : msg.content
    }))
  }

  return {
    isOpen,
    isLoading,
    messages,
    togglePanel,
    addMessage,
    getChatHistory
  }
})
