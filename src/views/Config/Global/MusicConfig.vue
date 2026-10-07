<script setup lang='ts'>
import type { IMusic } from '@/types/storeType'
import localforage from 'localforage'
import { storeToRefs } from 'pinia'
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import ConfirmDialog from '@/components/ConfirmDialog/index.vue'
import { useStorageFeedback } from '@/hooks/useStorageFeedback'

import useStore from '@/store'
import { readFileData } from '@/utils/file'
import { isBundledMusic } from '@/utils/music'

const { t } = useI18n()
const { storageError, busy, run } = useStorageFeedback()
const confirmDialog = ref<InstanceType<typeof ConfirmDialog>>()
const audioUploadToast = ref(0) // 0是不显示，1是成功，2是失败,3是不是图片
const maxAudioFileSize = 50 * 1024 * 1024
let toastTimer: ReturnType<typeof setTimeout> | undefined
const audioDbStore = localforage.createInstance({
  name: 'audioStore',
})
const globalConfig = useStore().globalConfig

const { getMusicList: localMusicList, getMusicVolume: musicVolume, getMusicMuted: musicMuted } = storeToRefs(globalConfig)
const muted = computed(() => musicMuted.value || musicVolume.value === 0)
function changeVolume(event: Event) {
  globalConfig.setMusicVolume(Number((event.target as HTMLInputElement).value))
  globalConfig.setMusicMuted(false)
}
function toggleMute() {
  if (muted.value) {
    if (musicVolume.value === 0)
      globalConfig.setMusicVolume(100)
    globalConfig.setMusicMuted(false)
  }
  else {
    globalConfig.setMusicMuted(true)
  }
}
const limitType = ref('audio/*')
async function play(item: IMusic) {
  globalConfig.setCurrentMusic(item, false)
}

async function deleteMusic(item: IMusic) {
  try {
    await run(async () => {
      if (item.url === 'Storage')
        await audioDbStore.removeItem(item.name)
      globalConfig.removeMusic(item.id)
      if (globalConfig.currentMusic.item?.id === item.id)
        globalConfig.setCurrentMusic(localMusicList.value[0], true)
    })
  }
  catch { /* Keep the list entry so deletion can be retried. */ }
}
async function resetMusic() {
  await run(async () => {
    await audioDbStore.clear()
    globalConfig.resetMusicList()
    globalConfig.setCurrentMusic(localMusicList.value[0], true)
  })
}
async function deleteAll() {
  await run(async () => {
    await audioDbStore.clear()
    globalConfig.clearMusicList()
    globalConfig.setCurrentMusic(localMusicList.value[0], true)
  })
}
async function getMusicDbStore() {
  const keys = await audioDbStore.keys()
  const existingStorageKeys = new Set(
    localMusicList.value.filter(item => item.url === 'Storage').map(item => item.name),
  )
  for (const key of keys) {
    if (existingStorageKeys.has(key)) {
      continue
    }
    globalConfig.addMusic({
      id: key,
      name: key,
      url: 'Storage',
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
    await run(async () => {
      await audioDbStore.setItem(`${new Date().getTime().toString()}+${fileName}`, dataUrl)
      await getMusicDbStore()
    })
    audioUploadToast.value = 1
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
  void run(getMusicDbStore).catch(() => {})
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
      <label for="music-upload" class="btn btn-primary btn-sm cursor-pointer">{{ t('admin.addLocalMusic') }}</label>
      <input id="music-upload" type="file" class="hidden" :accept="limitType" :disabled="busy" @change="handleFileChange">
      <button class="btn btn-warning btn-outline btn-sm" :disabled="busy" @click="confirmDialog?.open(t('dialog.resetMusic'), resetMusic)">
        {{ t('button.reset') }}
      </button>
      <button class="btn btn-error btn-outline btn-sm" :disabled="busy" @click="confirmDialog?.open(t('dialog.deleteMusic', { count: localMusicList.length }), deleteAll)">
        {{ t('button.allDelete') }}
      </button>
      <span class="ml-auto text-sm text-base-content/60">{{ t('admin.itemCount', { count: localMusicList.length }) }}</span>
    </div>
    <div class="rounded-xl border border-base-content/10 bg-base-200/40 p-4">
      <div class="flex flex-wrap items-center gap-3">
        <label for="music-volume" class="text-sm font-medium">{{ t('admin.musicVolume') }}</label>
        <button
          type="button" class="btn btn-ghost btn-square btn-sm"
          :aria-label="muted ? t('button.unmute') : t('button.mute')" :title="muted ? t('button.unmute') : t('button.mute')"
          :aria-pressed="muted" @click="toggleMute"
        >
          <svg aria-hidden="true" class="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M11 5 6 9H3v6h3l5 4V5Z" />
            <path v-if="muted" d="m17 9 5 6m0-6-5 6" />
            <path v-else d="M15.5 8.5a5 5 0 0 1 0 7m3-10a9 9 0 0 1 0 13" />
          </svg>
        </button>
        <input
          id="music-volume" type="range" min="0" max="100" step="1" :value="musicVolume"
          class="range range-primary range-xs w-36 sm:w-48" :aria-valuetext="`${musicVolume}%`" @input="changeVolume"
        >
        <output for="music-volume" class="min-w-10 text-sm tabular-nums">{{ musicVolume }}%</output>
      </div>
      <p class="mb-0 mt-3 text-sm leading-relaxed text-base-content/60">
        {{ t('admin.musicLocalHint') }}
      </p>
      <p class="mb-0 mt-1 text-sm leading-relaxed text-base-content/60">
        {{ t('admin.musicResetHint') }}
      </p>
    </div>
    <p v-if="storageError" role="alert" class="alert alert-error">
      {{ storageError }}
    </p>
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
              {{ item.url === 'Storage' ? t('admin.localFile') : isBundledMusic(item.url) ? t('admin.bundledAudio') : t('admin.remoteFile') }}
            </p>
          </div>
          <div class="flex shrink-0 gap-2 self-end sm:self-auto">
            <button class="btn btn-primary btn-outline btn-xs" @click="play(item)">
              {{ t('button.play') }}
            </button>
            <button class="btn btn-error btn-outline btn-xs" :disabled="busy" @click="deleteMusic(item)">
              {{ t('button.delete') }}
            </button>
          </div>
        </li>
      </ul>
    </section>
    <ConfirmDialog ref="confirmDialog" />
  </div>
</template>

<style lang='scss' scoped></style>
