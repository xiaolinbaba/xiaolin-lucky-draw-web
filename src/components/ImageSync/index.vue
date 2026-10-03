<script setup lang='ts'>
import localforage from 'localforage'
import { onUnmounted, ref, watch } from 'vue'

const props = defineProps({
  imgItem: {
    type: Object,
    default: () => ({}),
  },
})
const imageDbStore = localforage.createInstance({
  name: 'imgStore',
})

const imgUrl = ref('')
let request = 0

async function getImageStoreItem(item: any): Promise<string> {
  let image = ''
  if (item.url === 'Storage') {
    const key = item.id
    image = await imageDbStore.getItem(key) as string
  }
  else {
    image = item.url
  }

  return image
}

watch(() => [props.imgItem.id, props.imgItem.url], async () => {
  const current = ++request
  imgUrl.value = ''
  try {
    const image = await getImageStoreItem(props.imgItem)
    if (current === request)
      imgUrl.value = image || ''
  }
  catch {
    if (current === request)
      imgUrl.value = ''
  }
}, { immediate: true })
onUnmounted(() => request++)
</script>

<template>
  <img :src="imgUrl || undefined" alt="Image" class="object-cover h-full rounded-xl">
</template>

<style lang='scss' scoped>

</style>
