<script setup lang="ts">
import { useElementSize } from '@vueuse/core'
import localforage from 'localforage'
import Sparticles from 'sparticles'
import { onMounted, onUnmounted, ref, shallowRef } from 'vue'

interface SparticlesInstance {
  destroy: () => void
  setCanvasSize: (width: number, height: number) => void
}

const props = defineProps({
  homeBackground: {
    type: Object,
    default: () => ({
      id: '',
      name: '',
      url: '',
    }),
  },
})

const imageDbStore = localforage.createInstance({
  name: 'imgStore',
})

const imgUrl = ref('')
const starRef = ref<HTMLElement | null>(null)
const sparticles = shallowRef<SparticlesInstance | null>(null)
const { width, height } = useElementSize(starRef)

const sparticlesOptions = {
  shape: 'star',
  parallax: 1.2,
  rotate: true,
  twinkle: true,
  speed: 10,
  count: 200,
}

function addSparticles(node: HTMLElement, width: number, height: number) {
  sparticles.value?.destroy()
  sparticles.value = new Sparticles(node, sparticlesOptions, width, height)
}

function handleResize() {
  if (!starRef.value) {
    return
  }
  if (width.value && height.value) {
    sparticles.value?.setCanvasSize(width.value, height.value)
  }
}

async function getImageStoreItem(item: any): Promise<string> {
  if (item?.url === 'Storage') {
    const key = item.id
    return await imageDbStore.getItem(key) as string
  }
  return item?.url || ''
}

onMounted(() => {
  getImageStoreItem(props.homeBackground).then((image) => {
    imgUrl.value = image
  })

  if (starRef.value) {
    addSparticles(starRef.value, width.value, height.value)
  }

  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  sparticles.value?.destroy()
  sparticles.value = null
})
</script>

<template>
  <div v-if="homeBackground.url" class="home-background w-screen h-screen overflow-hidden">
    <img :src="imgUrl" class="w-full h-full object-cover" alt="">
  </div>
  <div v-else ref="starRef" class="w-screen h-screen overflow-hidden" />
</template>

<style lang="scss" scoped>
</style>
