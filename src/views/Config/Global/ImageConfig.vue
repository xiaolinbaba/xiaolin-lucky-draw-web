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
  <div class="config-page">
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

    <div class="config-toolbar">
      <label for="image-upload" class="btn btn-primary btn-sm cursor-pointer">{{ t('button.upload') }}</label>
      <input id="image-upload" type="file" class="hidden" :accept="limitType" @change="handleFileChange">
      <span class="ml-auto text-sm text-base-content/60">{{ t('admin.itemCount', { count: localImageList.length }) }}</span>
    </div>

    <section class="config-section">
      <header class="config-section-header">
        <h2 class="config-section-title">
          {{ t('admin.section.list') }}
        </h2>
      </header>
      <div v-if="localImageList.length === 0" class="config-empty">
        {{ t('table.noneData') }}
      </div>
      <ul v-else class="m-0 p-0">
        <li v-for="item in localImageList" :key="item.id" class="config-list-row">
          <div class="flex min-w-0 items-center gap-4">
            <div class="avatar shrink-0">
              <div class="h-12 w-12 rounded-lg bg-base-200">
                <ImageSync :img-item="item" />
              </div>
            </div>
            <span class="truncate font-medium" :title="item.name">{{ item.name }}</span>
          </div>
          <button class="btn btn-error btn-outline btn-xs self-end sm:self-auto" @click="removeImage(item)">
            {{ t('button.delete') }}
          </button>
        </li>
      </ul>
    </section>
  </div>
</template>

<style lang='scss' scoped></style>
