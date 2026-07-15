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
const localMusicListValue = ref(localMusicList)
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
  <div>
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
    <div class="flex gap-3">
      <button class="btn btn-primary btn-sm" @click="resetMusic">
        {{ t('button.reset') }}
      </button>
      <label for="explore">
        <input
          id="explore" type="file" class="" style="display: none" :accept="limitType"
          @change="handleFileChange"
        >
        <span class="btn btn-primary btn-sm">{{ t('button.upload') }}</span>
      </label>
      <button class="btn btn-error btn-sm" @click="deleteAll">
        {{ t('button.allDelete') }}
      </button>
    </div>
    <div>
      <ul class="p-0">
        <li v-for="item in localMusicListValue" :key="item.id" class="flex items-center gap-6 pb-2 mb-3 divide-y">
          <div class="mr-12 overflow-hidden w-72 whitespace-nowrap text-ellipsis">
            <span>
              {{ item.name }}</span>
          </div>
          <div class="flex gap-3">
            <button class="btn btn-primary btn-xs" @click="play(item)">
              {{ t('button.play') }}
            </button>
            <button class="btn btn-error btn-xs" @click="deleteMusic(item)">
              {{ t('button.delete') }}
            </button>
          </div>
        </li>
      </ul>
    </div>
  </div>
</template>

<style lang='scss' scoped></style>
