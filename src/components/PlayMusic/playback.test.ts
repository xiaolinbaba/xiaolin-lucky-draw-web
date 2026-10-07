import type { IMusic } from '@/types/storeType'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import i18n from '@/locales/i18n'
import { useGlobalConfig } from '@/store/globalConfig'
import PlayMusic from './index.vue'

const { getItem } = vi.hoisted(() => ({ getItem: vi.fn() }))
vi.mock('localforage', () => ({ default: { createInstance: () => ({ getItem }) } }))
vi.mock('vue-router', () => ({ useRoute: () => ({ path: '/home' }), useRouter: () => ({ push: vi.fn() }) }))

describe('audio playback lifecycle', () => {
  beforeEach(() => {
    vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue(undefined)
    vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {})
    vi.spyOn(HTMLMediaElement.prototype, 'load').mockImplementation(() => {})
    getItem.mockReset()
  })
  afterEach(() => {
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  function setup(tracks?: IMusic[], volume?: number, muted = false) {
    const pinia = createPinia()
    setActivePinia(pinia)
    const store = useGlobalConfig()
    if (volume !== undefined) {
      store.setMusicVolume(volume)
      store.setMusicMuted(muted)
    }
    if (tracks)
      store.globalConfig.musicList = tracks
    const wrapper = mount(PlayMusic, { global: { plugins: [pinia, i18n], stubs: { 'svg-icon': true } } })
    return { wrapper, store }
  }

  it('applies saved volume and mute preferences before playback', () => {
    const { wrapper } = setup(undefined, 35, true)
    const audio = wrapper.get('audio').element as HTMLAudioElement
    expect(audio.volume).toBe(0.35)
    expect(audio.muted).toBe(true)
    expect(HTMLMediaElement.prototype.play).not.toHaveBeenCalled()
    wrapper.unmount()
  })

  it('adjusts and mutes a playing track without restarting it', async () => {
    const { wrapper, store } = setup()
    store.setCurrentMusic(store.getMusicList[0], false)
    await flushPromises()
    const audio = wrapper.get('audio').element as HTMLAudioElement
    audio.currentTime = 42
    store.setMusicVolume(25)
    store.setMusicMuted(true)
    expect(audio.volume).toBe(0.25)
    expect(audio.muted).toBe(true)
    store.setMusicMuted(false)
    expect(audio.muted).toBe(false)
    expect(audio.currentTime).toBe(42)
    expect(HTMLMediaElement.prototype.play).toHaveBeenCalledTimes(1)
    expect(store.currentMusic.paused).toBe(false)
    wrapper.unmount()
  })

  it('repairs an existing playlist while keeping track IDs and uploaded entries', () => {
    const tracks = [
      { id: 'old-id', name: 'Radetzky March.mp3', url: 'https://to2026.xyz/resource/audio/Radetzky March.mp3' },
      { id: 'upload-id', name: 'mine.mp3', url: 'Storage' },
    ]
    const { wrapper, store } = setup(tracks)
    expect(store.getMusicList).toHaveLength(2)
    expect(store.getMusicList[0].url).not.toContain('to2026.xyz')
    expect(store.getMusicList[0].id).toBe('old-id')
    expect(store.getMusicList[1]).toEqual(tracks[1])
    expect(store.currentMusic.item.id).toBe('old-id')
    wrapper.unmount()
  })

  it('does not restart a track when its storage read finishes after pause', async () => {
    let resolveRead!: (url: string) => void
    getItem.mockImplementation(() => new Promise<string>((resolve) => {
      resolveRead = resolve
    }))
    const { wrapper, store } = setup()
    const track = { id: 'track', name: 'track.mp3', url: 'Storage' }
    store.setCurrentMusic(track, false)
    await nextTick()
    store.setCurrentMusic(track, true)
    await nextTick()
    resolveRead('data:audio/mp3;base64,AAAA')
    await flushPromises()

    expect(HTMLMediaElement.prototype.play).not.toHaveBeenCalled()
    expect(store.currentMusic.paused).toBe(true)
    wrapper.unmount()
  })

  it('cancels pending playback and releases audio on unmount', async () => {
    let resolveRead!: (url: string) => void
    getItem.mockImplementation(() => new Promise<string>((resolve) => {
      resolveRead = resolve
    }))
    const { wrapper, store } = setup()
    store.setCurrentMusic({ id: 'track', name: 'track.mp3', url: 'Storage' }, false)
    await nextTick()
    wrapper.unmount()
    resolveRead('data:audio/mp3;base64,AAAA')
    await flushPromises()

    expect(HTMLMediaElement.prototype.play).not.toHaveBeenCalled()
    expect(HTMLMediaElement.prototype.pause).toHaveBeenCalled()
    expect(HTMLMediaElement.prototype.load).toHaveBeenCalled()
  })

  it('resumes the same track without resetting its playback position', async () => {
    const { wrapper, store } = setup()
    const track = store.getMusicList[0]
    store.setCurrentMusic(track, false)
    await flushPromises()
    const audio = wrapper.get('audio').element as HTMLAudioElement
    audio.currentTime = 42
    store.setCurrentMusic(track, true)
    store.setCurrentMusic(track, false)
    await flushPromises()

    expect(audio.currentTime).toBe(42)
    expect(HTMLMediaElement.prototype.play).toHaveBeenCalledTimes(2)
    expect(store.currentMusic.paused).toBe(false)
    wrapper.unmount()
  })

  it('reports a missing uploaded file without trying to play it', async () => {
    getItem.mockResolvedValue(null)
    const { wrapper, store } = setup()
    store.setCurrentMusic({ id: 'missing', name: 'missing.mp3', url: 'Storage' }, false)
    await flushPromises()

    expect(HTMLMediaElement.prototype.play).not.toHaveBeenCalled()
    expect(store.currentMusic.paused).toBe(true)
    expect(wrapper.get('[role="alert"]').text()).toContain(i18n.global.t('error.audioMissing'))
    wrapper.unmount()
  })

  it('shows browser blocking feedback and lets the user retry', async () => {
    vi.mocked(HTMLMediaElement.prototype.play).mockRejectedValueOnce(new DOMException('Blocked', 'NotAllowedError'))
    const { wrapper, store } = setup()
    store.setCurrentMusic(store.getMusicList[0], false)
    await flushPromises()
    expect(store.currentMusic.paused).toBe(true)
    expect(wrapper.get('[role="alert"]').text()).toContain(i18n.global.t('error.audioBlocked'))

    store.setCurrentMusic(store.getMusicList[0], false)
    await flushPromises()
    expect(wrapper.find('[role="alert"]').exists()).toBe(false)
    expect(store.currentMusic.paused).toBe(false)
    wrapper.unmount()
  })

  it('ignores an old playback failure after selecting another track', async () => {
    let rejectOld!: (error: Error) => void
    vi.mocked(HTMLMediaElement.prototype.play).mockImplementationOnce(() => new Promise<void>((_, reject) => {
      rejectOld = reject
    }))
    const { wrapper, store } = setup()
    store.setCurrentMusic(store.getMusicList[0], false)
    store.setCurrentMusic(store.getMusicList[1], false)
    await flushPromises()
    rejectOld(new Error('Old playback cancelled'))
    await flushPromises()

    expect(store.currentMusic.item.id).toBe(store.getMusicList[1].id)
    expect(store.currentMusic.paused).toBe(false)
    expect(wrapper.find('[role="alert"]').exists()).toBe(false)
    wrapper.unmount()
  })

  it('advances to the next track when playback ends', async () => {
    const { wrapper, store } = setup()
    store.setCurrentMusic(store.getMusicList[0], false)
    await flushPromises()
    await wrapper.get('audio').trigger('ended')
    await flushPromises()

    expect(store.currentMusic.item.id).toBe(store.getMusicList[1].id)
    expect(store.currentMusic.paused).toBe(false)
    wrapper.unmount()
  })

  it('stops loading and reports a track that never starts', async () => {
    vi.useFakeTimers()
    vi.mocked(HTMLMediaElement.prototype.play).mockImplementation(() => new Promise(() => {}))
    const { wrapper, store } = setup()
    store.setCurrentMusic(store.getMusicList[0], false)
    await nextTick()
    expect(wrapper.get('[aria-busy]').attributes('aria-busy')).toBe('true')
    await vi.advanceTimersByTimeAsync(20000)
    await nextTick()

    expect(store.currentMusic.paused).toBe(true)
    expect(wrapper.get('[aria-busy]').attributes('aria-busy')).toBe('false')
    expect(wrapper.get('[role="alert"]').text()).toContain(i18n.global.t('error.audioPlayback'))
    wrapper.unmount()
    expect(vi.getTimerCount()).toBe(0)
  })
})
