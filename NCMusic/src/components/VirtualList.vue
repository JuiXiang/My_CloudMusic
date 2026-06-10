<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'

const props = withDefaults(defineProps<{
  items: any[]
  itemHeight: number
  buffer?: number
}>(), {
  buffer: 5,
})

const emit = defineEmits<{
  (e: 'itemClick', item: any, index: number): void
}>()

const containerRef = ref<HTMLElement | null>(null)
const scrollTop = ref(0)
const containerHeight = ref(0)

const totalCount = computed(() => props.items.length)
const totalHeight = computed(() => totalCount.value * props.itemHeight)

const visibleStart = computed(() => {
  const start = Math.floor(scrollTop.value / props.itemHeight) - props.buffer
  return Math.max(0, start)
})

const visibleEnd = computed(() => {
  const end = Math.ceil((scrollTop.value + containerHeight.value) / props.itemHeight) + props.buffer
  return Math.min(totalCount.value, end)
})

const visibleItems = computed(() => {
  return props.items.slice(visibleStart.value, visibleEnd.value).map((item, i) => ({
    data: item,
    index: visibleStart.value + i,
  }))
})

const offsetY = computed(() => visibleStart.value * props.itemHeight)

const onScroll = (e: Event) => {
  const el = e.target as HTMLElement
  scrollTop.value = el.scrollTop
}

let resizeObserver: ResizeObserver | null = null

onMounted(() => {
  if (containerRef.value) {
    containerHeight.value = containerRef.value.clientHeight
    resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        containerHeight.value = entry.contentRect.height
      }
    })
    resizeObserver.observe(containerRef.value)
  }
})

onUnmounted(() => {
  resizeObserver?.disconnect()
})
</script>

<template>
  <div
    ref="containerRef"
    class="virtual-list"
    @scroll="onScroll"
  >
    <div class="virtual-list-phantom" :style="{ height: totalHeight + 'px' }"></div>
    <div class="virtual-list-content" :style="{ transform: `translateY(${offsetY}px)` }">
      <div
        v-for="{ data, index } in visibleItems"
        :key="data.id ?? index"
        class="virtual-list-item"
        :style="{ height: itemHeight + 'px' }"
        @click="emit('itemClick', data, index)"
      >
        <slot :item="data" :index="index"></slot>
      </div>
    </div>
  </div>
</template>

<style scoped>
.virtual-list {
  overflow-y: auto;
  position: relative;
}

.virtual-list-phantom {
  position: absolute;
  left: 0;
  top: 0;
  right: 0;
  z-index: -1;
}

.virtual-list-content {
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
}

.virtual-list-item {
  box-sizing: border-box;
}
</style>
