<script setup lang='ts'>
import type { IMusic } from '@/types/storeType'
import localforage from 'localforage'
import { storeToRefs } from 'pinia'
import { onMounted, onUnmounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import useStore from '@/store'
import { readFileData } from '@/utils/file'

const { t } = useI18n()
const audioUploadToast = ref(0) // 0是不显示，1是成功，2是失败,3是不是图片
const maxAudioFileSize = 50 * 1024 * 1024
let toastTimer: ReturnType<typeof setTimeout> | undefined
const audioDbStore = localforage.createInstance({
  name: 'audioStore',
})
const globalConfig = useStore().globalConfig

const { getMusicList: localMusicList } = storeToRefs(globalConfig)
const limitType = ref('audio/*')
async function play(item: IMusic) {
  globalConfig.setCurrentMusic(item, false)
}

function deleteMusic(item: IMusic) {
  globalConfig.removeMusic(item.id)
  void audioDbStore.removeItem(item.name)
  // setTimeout(()=>{
  //     localMusicListValue.value=localMusicList
  // },100)
}
function resetMusic() {
  globalConfig.resetMusicList()
  void audioDbStore.clear()
}
function deleteAll() {
  globalConfig.clearMusicList()
  void audioDbStore.clear()
}
async function getMusicDbStore() {
  const keys = await audioDbStore.keys()
  const existingStorageKeys = new Set(
    localMusicList.value.filter(item => item.url === 'Storage').map(item => item.name),
  )
  if (keys.length > 0) {
    audioDbStore.iterate((value: string, key: string) => {
      if (existingStorageKeys.has(key)) {
        return
      }
      globalConfig.addMusic({
        id: key,
        name: key,
        url: 'Storage',
      })
    })
  }
}
async function handleFileChange(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) {
    return
  }
  if (!file.type.startsWith('audio/')) {
    audioUploadToast.value = 3
    input.value = ''
    return
  }
  if (file.size > maxAudioFileSize) {
    audioUploadToast.value = 4
    input.value = ''
    return
  }

  try {
    const { dataUrl, fileName } = await readFileData(file)
    await audioDbStore.setItem(`${new Date().getTime().toString()}+${fileName}`, dataUrl)
    audioUploadToast.value = 1
    await getMusicDbStore()
  }
  catch (error) {
    console.error('Failed to store audio', error)
    audioUploadToast.value = 2
  }
  finally {
    input.value = ''
  }
}

onMounted(() => {
  void getMusicDbStore()
})
watch(audioUploadToast, (value) => {
  if (value !== 0) {
    clearTimeout(toastTimer)
    toastTimer = setTimeout(() => {
      audioUploadToast.value = 0
    }, 2000)
  }
})
onUnmounted(() => clearTimeout(toastTimer))
</script>

<template>
  <div class="config-page">
    <div class="toast toast-top toast-end">
      <div v-if="audioUploadToast === 2" class="alert alert-error">
        <span>{{ t('error.uploadFail') }}</span>
      </div>
      <div v-if="audioUploadToast === 1" class="alert alert-success">
        <span>{{ t('error.uploadSuccess') }}</span>
      </div>
      <div v-if="audioUploadToast === 3" class="alert alert-error">
        <span>{{ t('error.notAudio') }}</span>
      </div>
      <div v-if="audioUploadToast === 4" class="alert alert-error">
        <span>{{ t('error.fileTooLarge', { size: 50 }) }}</span>
      </div>
    </div>
    <div class="config-toolbar">
      <label for="music-upload" class="btn btn-primary btn-sm cursor-pointer">{{ t('button.upload') }}</label>
      <input id="music-upload" type="file" class="hidden" :accept="limitType" @change="handleFileChange">
      <button class="btn btn-warning btn-outline btn-sm" @click="resetMusic">
        {{ t('button.reset') }}
      </button>
      <button class="btn btn-error btn-outline btn-sm" @click="deleteAll">
        {{ t('button.allDelete') }}
      </button>
      <span class="ml-auto text-sm text-base-content/60">{{ t('admin.itemCount', { count: localMusicList.length }) }}</span>
    </div>

    <section class="config-section">
      <header class="config-section-header">
        <h2 class="config-section-title">
          {{ t('admin.section.list') }}
        </h2>
      </header>
      <div v-if="localMusicList.length === 0" class="config-empty">
        {{ t('table.noneData') }}
      </div>
      <ul v-else class="m-0 p-0">
        <li v-for="item in localMusicList" :key="item.id" class="config-list-row">
          <div class="min-w-0">
            <p class="m-0 truncate font-medium" :title="item.name">
              {{ item.name }}
            </p>
            <p class="mb-0 mt-1 text-xs text-base-content/50">
              {{ item.url === 'Storage' ? t('admin.localFile') : t('admin.remoteFile') }}
            </p>
          </div>
          <div class="flex shrink-0 gap-2 self-end sm:self-auto">
            <button class="btn btn-primary btn-outline btn-xs" @click="play(item)">
              {{ t('button.play') }}
            </button>
            <button class="btn btn-error btn-outline btn-xs" @click="deleteMusic(item)">
              {{ t('button.delete') }}
            </button>
          </div>
        </li>
      </ul>
    </section>
  </div>
</template>

<style lang='scss' scoped></style>
