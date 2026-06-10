import { ref, computed, onMounted, onBeforeUnmount } from 'vue'

export function useVirtualList(listDataRef, options = {}) {
  const { itemHeight = 50, buffer = 4 } = options

  const containerRef = ref(null)
  const scrollTop = ref(0)
  const containerHeight = ref(0)

  const totalHeight = computed(() => listDataRef.value.length * itemHeight)

  // 可视区域能够渲染的元素个数
  const visibleCount = computed(() => Math.ceil(containerHeight.value / itemHeight) + buffer)

  // 起始索引
  const startIndex = computed(() => {
    return Math.max(0, Math.floor(scrollTop.value / itemHeight) - Math.floor(buffer / 2))
  })

  // 结束索引
  const endIndex = computed(() => startIndex.value + visibleCount.value)

  // 截取可视区域的数据
  const visibleList = computed(() => {
    return listDataRef.value.slice(startIndex.value, Math.min(endIndex.value, listDataRef.value.length)).map((item, index) => ({
      ...item,
      _index: startIndex.value + index
    }))
  })

  // 列表的 Y 轴偏移量
  const offsetY = computed(() => startIndex.value * itemHeight)

  const handleScroll = (e) => {
    requestAnimationFrame(() => {
      scrollTop.value = e.target.scrollTop
    })
  }

  let resizeObserver = null

  onMounted(() => {
    if (containerRef.value) {
      containerHeight.value = containerRef.value.clientHeight || window.innerHeight
      resizeObserver = new ResizeObserver((entries) => {
        for (let entry of entries) {
          containerHeight.value = entry.contentRect.height
        }
      })
      resizeObserver.observe(containerRef.value)
    } else {
      containerHeight.value = window.innerHeight
    }
  })

  onBeforeUnmount(() => {
    if (resizeObserver) {
      resizeObserver.disconnect()
    }
  })

  return {
    containerRef,
    totalHeight,
    visibleList,
    offsetY,
    handleScroll
  }
}
