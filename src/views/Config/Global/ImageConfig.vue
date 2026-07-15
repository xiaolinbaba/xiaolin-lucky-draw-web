<script setup lang='ts'>
import type { IImage } from '@/types/storeType'
import localforage from 'localforage'
import { storeToRefs } from 'pinia'
import { onMounted, onUnmounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import ImageSync from '@/components/ImageSync/index.vue'
import useStore from '@/store'
import { readFileData } from '@/utils/file'

const { t } = useI18n()
const globalConfig = useStore().globalConfig
const { getImageList: localImageList } = storeToRefs(globalConfig)
const limitType = ref('image/*')
const imgUploadToast = ref(0) // 0是不显示，1是成功，2是失败,3是不是图片
const maxImageFileSize = 10 * 1024 * 1024
let toastTimer: ReturnType<typeof setTimeout> | undefined
const imageDbStore = localforage.createInstance({
  name: 'imgStore',
})
async function handleFileChange(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) {
    return
  }
  if (!file.type.startsWith('image/')) {
    imgUploadToast.value = 3
    input.value = ''
    return
  }
  if (file.size > maxImageFileSize) {
    imgUploadToast.value = 4
    input.value = ''
    return
  }

  try {
    const { dataUrl, fileName } = await readFileData(file)
    await imageDbStore.setItem(`${new Date().getTime().toString()}+${fileName}`, dataUrl)
    imgUploadToast.value = 1
    await getImageDbStore()
  }
  catch (error) {
    console.error('Failed to store image', error)
    imgUploadToast.value = 2
  }
  finally {
    input.value = ''
  }
}

async function getImageDbStore() {
  const keys = await imageDbStore.keys()
  const existingImageIds = new Set(localImageList.value.map(item => item.id))
  if (keys.length > 0) {
    imageDbStore.iterate((value, key) => {
      if (existingImageIds.has(key)) {
        return
      }
      globalConfig.addImage({
        id: key,
        name: key,
        url: 'Storage',
      })
    })
  }
}

function removeImage(item: IImage) {
  if (item.url === 'Storage') {
    imageDbStore.removeItem(item.id).then(() => {
      globalConfig.removeImage(item.id)
    })
  }
  globalConfig.removeImage(item.id)
}
onMounted(() => {
  void getImageDbStore()
})
watch(() => imgUploadToast.value, (val) => {
  if (val !== 0) {
    clearTimeout(toastTimer)
    toastTimer = setTimeout(() => {
      imgUploadToast.value = 0
    }, 2000)
  }
})
onUnmounted(() => clearTimeout(toastTimer))
</script>

<template>
  <div class="toast toast-top toast-end">
    <div v-if="imgUploadToast === 2" class="alert alert-error">
      <span>{{ t('error.uploadFail') }}</span>
    </div>
    <div v-if="imgUploadToast === 1" class="alert alert-success">
      <span>{{ t('error.uploadSuccess') }}</span>
    </div>
    <div v-if="imgUploadToast === 3" class="alert alert-error">
      <span>{{ t('error.notImage') }}</span>
    </div>
    <div v-if="imgUploadToast === 4" class="alert alert-error">
      <span>{{ t('error.fileTooLarge', { size: 10 }) }}</span>
    </div>
  </div>

  <div class="p-6">
    <div class="">
      <label for="explore">
        <input
          id="explore" type="file" class="" style="display: none" :accept="limitType"
          @change="handleFileChange"
        >
        <span class="btn btn-primary btn-sm">{{ t('button.upload') }}</span>
      </label>
    </div>
    <ul class="p-0">
      <li v-for="item in localImageList" :key="item.id" class="mb-3">
        <div class="flex items-center gap-8">
          <div class="avatar h-14">
            <div class="w-12 h-12 mask mask-squircle hover:w-14 hover:h-14">
              <!-- <img v-if="item.url!=='Storage'" :src="item.url" alt="Avatar Tailwind CSS Component" /> -->
              <ImageSync :img-item="item" />
            </div>
          </div>
          <div class="w-64">
            <div class="overflow-hidden font-bold whitespace-nowrap text-ellipsis">
              {{ item.name }}
            </div>
          </div>
          <div>
            <button class="btn btn-error btn-xs" @click="removeImage(item)">
              {{ t('button.delete') }}
            </button>
          </div>
        </div>
      </li>
    </ul>
  </div>
</template>

<style lang='scss' scoped></style>
