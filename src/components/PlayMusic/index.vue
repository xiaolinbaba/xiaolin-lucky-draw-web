<script setup lang='ts'>
import localforage from 'localforage'
import { storeToRefs } from 'pinia'
import { onMounted, onUnmounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import useStore from '@/store'

const { t } = useI18n()
const router = useRouter()
const route = useRoute()
const audioDbStore = localforage.createInstance({
  name: 'audioStore',
})
const audio = ref(new Audio())
const settingRef = ref()
// const audio = ref(new Audio())
const globalConfig = useStore().globalConfig
const { getMusicList: localMusicList, getCurrentMusic: currentMusic } = storeToRefs(globalConfig)
// const localMusicListValue = ref(localMusicList)

async function play(item: any) {
  if (!item) {
    return
  }
  // if (!audio.value.paused && !skip) {
  //     audio.value.pause()

  //     return
  // }
  let audioUrl = ''
  if (!item.url) {
    return
  }
  if (item.url === 'Storage') {
    audioUrl = await audioDbStore.getItem(item.name) as string
  }
  else {
    audioUrl = item.url
  }
  audio.value.pause()
  audio.value.src = audioUrl
  try {
    await audio.value.play()
  }
  catch (error) {
    console.error('Unable to play audio', error)
    globalConfig.setCurrentMusic(item, true)
  }
}
function playMusic(item: any, skip = false) {
  if (!item) {
    return
  }
  if (!currentMusic.value.paused && !skip) {
    globalConfig.setCurrentMusic(item, true)

    return
  }
  globalConfig.setCurrentMusic(item, false)
}
function nextPlay() {
  // 播放下一首
  if (localMusicList.value.length >= 1) {
    let index = localMusicList.value.findIndex((item: any) => item.name === currentMusic.value.item.name)
    index++
    if (index >= localMusicList.value.length) {
      index = 0
    }
    globalConfig.setCurrentMusic(localMusicList.value[index], false)
  }
}
// 监听播放成后开始下一首
function onPlayEnd() {
  audio.value.addEventListener('ended', nextPlay)
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
  globalConfig.setCurrentMusic(localMusicList.value[0], true)
  onPlayEnd()
  // 不使用空格控制audio

  // 监听全屏状态变化
  document.addEventListener('fullscreenchange', handleFullscreenChange)
})
function handleFullscreenChange() {
  isFullscreen.value = !!document.fullscreenElement
}

onUnmounted(() => {
  audio.value.removeEventListener('ended', nextPlay)
  document.removeEventListener('fullscreenchange', handleFullscreenChange)
})
watch(currentMusic, (val: any) => {
  if (!val.paused && audio.value) {
    void play(val.item)
  }
  else {
    audio.value.pause()
  }
}, { deep: true })
</script>

<template>
  <div ref="settingRef" class="flex flex-col gap-3">
    <div v-if="route.path.includes('/config')" class="tooltip tooltip-left" :data-tip="t('tooltip.toHome')">
      <div
        class="flex items-center justify-center w-10 h-10 p-0 m-0 cursor-pointer setting-container bg-slate-500/50 rounded-l-xl hover:bg-slate-500/80 hover:text-blue-400/90"
        @click="enterHome"
      >
        <svg-icon name="home" />
      </div>
    </div>
    <div v-else class="tooltip tooltip-left" :data-tip="t('tooltip.settingConfiguration')">
      <div
        class="flex items-center justify-center w-10 h-10 p-0 m-0 cursor-pointer setting-container bg-slate-500/50 rounded-l-xl hover:bg-slate-500/80 hover:text-blue-400/90"
        @click="enterConfig"
      >
        <svg-icon name="setting" />
      </div>
    </div>

    <div class="tooltip tooltip-left" :data-tip="currentMusic.item ? `${currentMusic.item.name}\n\r ${t('tooltip.nextSong')}` : t('tooltip.noSongPlay')">
      <div
        class="flex items-center justify-center w-10 h-10 p-0 m-0 cursor-pointer setting-container bg-slate-500/50 rounded-l-xl hover:bg-slate-500/80 hover:text-blue-400/90"
        @click="playMusic(currentMusic.item)" @click.right.prevent="nextPlay"
      >
        <svg-icon :name="currentMusic.paused ? 'play' : 'pause'" />
      </div>
    </div>

    <div class="tooltip tooltip-left" :data-tip="isFullscreen ? t('tooltip.exitFullscreen') : t('tooltip.fullscreen')">
      <div
        class="flex items-center justify-center w-10 h-10 p-0 m-0 cursor-pointer setting-container bg-slate-500/50 rounded-l-xl hover:bg-slate-500/80 hover:text-blue-400/90"
        @click="toggleFullscreen"
      >
        <svg v-if="!isFullscreen" xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
        </svg>
        <svg v-else xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3" />
        </svg>
      </div>
    </div>
  </div>
</template>

<style lang='scss' scoped>
details {

    // display: none;
    summary {
        display: none;
    }
}
</style>
