<script setup lang='ts'>
import type { IMusic } from '@/types/storeType'
import localforage from 'localforage'
import { storeToRefs } from 'pinia'
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import useStore from '@/store'
import { resolveMusicUrl } from '@/utils/music'

const { t } = useI18n()
const router = useRouter()
const route = useRoute()
const isConfigRoute = computed(() => route.path.includes('/config'))
const audioDbStore = localforage.createInstance({
  name: 'audioStore',
})
const audio = ref<HTMLAudioElement>()
const loading = ref(false)
const playbackError = ref('')
let loadedUrl = ''
let playRequest = 0
let cancelPendingPlay: (() => void) | undefined
const globalConfig = useStore().globalConfig
const { getMusicList: localMusicList, getCurrentMusic: currentMusic, getMusicVolume: musicVolume, getMusicMuted: musicMuted } = storeToRefs(globalConfig)

function failPlayback(item: IMusic, key: string) {
  globalConfig.setCurrentMusic(item, true)
  playbackError.value = key
}
async function play(item: IMusic, request: number) {
  const element = audio.value
  if (!element)
    return
  let timeout: ReturnType<typeof setTimeout> | undefined
  let cancelWait: (() => void) | undefined
  loading.value = true
  try {
    const audioUrl = item.url === 'Storage'
      ? await audioDbStore.getItem<string>(item.name)
      : resolveMusicUrl(item.url)
    // A previous storage read may finish after pause, next-track, or unmount.
    if (request !== playRequest)
      return
    if (!audioUrl) {
      failPlayback(item, item.url === 'Storage' ? 'error.audioMissing' : 'tooltip.noSongPlay')
      return
    }
    // Preserve the current position when resuming the same track.
    if (loadedUrl !== audioUrl || element.error) {
      element.pause()
      element.src = audioUrl
      loadedUrl = audioUrl
    }
    const loadingLimit = new Promise<void>((resolve, reject) => {
      cancelWait = () => {
        clearTimeout(timeout)
        resolve()
      }
      cancelPendingPlay = cancelWait
      timeout = setTimeout(() => reject(new Error('Audio loading timed out')), 20000)
    })
    await Promise.race([element.play(), loadingLimit])
  }
  catch (error) {
    console.error('Unable to play audio', error)
    if (request === playRequest)
      failPlayback(item, (error instanceof Error || error instanceof DOMException) && error.name === 'NotAllowedError' ? 'error.audioBlocked' : 'error.audioPlayback')
  }
  finally {
    clearTimeout(timeout)
    if (cancelPendingPlay === cancelWait)
      cancelPendingPlay = undefined
    if (request === playRequest)
      loading.value = false
  }
}
function playMusic(item: IMusic) {
  if (!item.url) {
    playbackError.value = 'tooltip.noSongPlay'
    return
  }
  globalConfig.setCurrentMusic(item, !currentMusic.value.paused)
}
function nextPlay() {
  // 播放下一首
  if (localMusicList.value.length >= 1) {
    let index = localMusicList.value.findIndex(item => item.id === currentMusic.value.item.id)
    index++
    if (index >= localMusicList.value.length) {
      index = 0
    }
    globalConfig.setCurrentMusic(localMusicList.value[index], false)
  }
}
function handleAudioError() {
  if (!currentMusic.value.paused && !loading.value)
    failPlayback(currentMusic.value.item, 'error.audioPlayback')
}

function enterConfig() {
  router.push('/config')
}
function enterHome() {
  router.push('/home')
}

const isFullscreen = ref(false)

function toggleFullscreen() {
  if (!document.fullscreenElement) {
    // 进入全屏
    document.documentElement.requestFullscreen().then(() => {
      isFullscreen.value = true
    }).catch((err) => {
      console.error('无法进入全屏:', err)
    })
  }
  else {
    // 退出全屏
    document.exitFullscreen().then(() => {
      isFullscreen.value = false
    }).catch((err) => {
      console.error('无法退出全屏:', err)
    })
  }
}

onMounted(() => {
  syncVolume()
  globalConfig.repairDefaultMusicUrls()
  globalConfig.setCurrentMusic(localMusicList.value[0], true)

  // 监听全屏状态变化
  document.addEventListener('fullscreenchange', handleFullscreenChange)
})
function handleFullscreenChange() {
  isFullscreen.value = !!document.fullscreenElement
}
function syncVolume() {
  if (audio.value) {
    audio.value.volume = musicVolume.value / 100
    audio.value.muted = musicMuted.value
  }
}
watch([musicVolume, musicMuted], syncVolume, { flush: 'sync' })

onBeforeUnmount(() => {
  playRequest++
  cancelPendingPlay?.()
  audio.value?.pause()
  audio.value?.removeAttribute('src')
  audio.value?.load()
  document.removeEventListener('fullscreenchange', handleFullscreenChange)
})
watch(currentMusic, (val) => {
  const request = ++playRequest
  cancelPendingPlay?.()
  cancelPendingPlay = undefined
  playbackError.value = ''
  loading.value = false
  if (!val.paused && audio.value) {
    void play(val.item, request)
  }
  else {
    audio.value?.pause()
  }
}, { deep: true, flush: 'sync' })
</script>

<template>
  <audio ref="audio" preload="none" @ended="nextPlay" @error="handleAudioError" />
  <div v-if="playbackError" class="toast toast-top toast-end z-50 max-w-full" data-theme="light">
    <div role="alert" class="alert alert-error max-w-sm">
      <span>{{ t(playbackError) }}</span>
      <button type="button" class="btn btn-ghost btn-xs" :aria-label="t('button.close')" @click="playbackError = ''">
        ×
      </button>
    </div>
  </div>
  <div
    :data-theme="isConfigRoute ? 'light' : undefined" class="fixed z-30 flex gap-2"
    :class="isConfigRoute ? 'bottom-20 right-4 flex-row rounded-xl border border-base-content/10 bg-base-100/90 p-1 shadow-lg md:bottom-auto md:top-5' : 'bottom-1/2 right-0 flex-col'"
  >
    <div v-if="isConfigRoute" class="tooltip tooltip-top" :data-tip="t('tooltip.toHome')">
      <button
        type="button" class="btn btn-square btn-sm rounded-lg bg-base-100"
        :aria-label="t('tooltip.toHome')"
        @click="enterHome"
      >
        <svg-icon name="home" />
      </button>
    </div>
    <div v-else class="tooltip tooltip-left" :data-tip="t('tooltip.settingConfiguration')">
      <button
        type="button" class="btn btn-square btn-sm rounded-r-none border-r-0 bg-base-100 shadow-md"
        :aria-label="t('tooltip.settingConfiguration')"
        @click="enterConfig"
      >
        <svg-icon name="setting" />
      </button>
    </div>

    <div class="tooltip" :class="isConfigRoute ? 'tooltip-top' : 'tooltip-left'" :data-tip="currentMusic.item ? `${currentMusic.item.name}\n\r ${t('tooltip.nextSong')}` : t('tooltip.noSongPlay')">
      <button
        type="button" class="btn btn-square btn-sm bg-base-100" :class="isConfigRoute ? 'rounded-lg' : 'rounded-r-none border-r-0 shadow-md'"
        :aria-label="currentMusic.paused ? t('button.play') : t('button.pause')" :aria-busy="loading"
        @click="playMusic(currentMusic.item)" @click.right.prevent="nextPlay"
      >
        <span v-if="loading" class="loading loading-spinner loading-xs" />
        <svg-icon v-else :name="currentMusic.paused ? 'play' : 'pause'" />
      </button>
    </div>

    <div class="tooltip" :class="isConfigRoute ? 'tooltip-top' : 'tooltip-left'" :data-tip="isFullscreen ? t('tooltip.exitFullscreen') : t('tooltip.fullscreen')">
      <button
        type="button" class="btn btn-square btn-sm bg-base-100" :class="isConfigRoute ? 'rounded-lg' : 'rounded-r-none border-r-0 shadow-md'"
        :aria-label="isFullscreen ? t('tooltip.exitFullscreen') : t('tooltip.fullscreen')"
        @click="toggleFullscreen"
      >
        <svg v-if="!isFullscreen" xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
        </svg>
        <svg v-else xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3" />
        </svg>
      </button>
    </div>
  </div>
</template>
