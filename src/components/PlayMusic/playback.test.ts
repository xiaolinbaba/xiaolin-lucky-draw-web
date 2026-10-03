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
  afterEach(() => vi.restoreAllMocks())

  function setup() {
    const pinia = createPinia()
    setActivePinia(pinia)
    const wrapper = mount(PlayMusic, { global: { plugins: [pinia, i18n], stubs: { 'svg-icon': true } } })
    return { wrapper, store: useGlobalConfig() }
  }

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
})
