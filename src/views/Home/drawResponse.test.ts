import * as TWEEN from '@tweenjs/tween.js'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import i18n from '@/locales/i18n'
import useStore from '@/store'
import Home from './index.vue'

const celebration = vi.hoisted(() => Object.assign(vi.fn(), { reset: vi.fn() }))
vi.mock('canvas-confetti', () => ({ default: celebration }))
vi.mock('vue-toast-notification', () => ({ useToast: () => ({ open: vi.fn() }) }))
vi.mock('vue-router', () => ({ useRouter: () => ({ push: vi.fn() }) }))

describe('draw result responsiveness', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'requestAnimationFrame', 'cancelAnimationFrame', 'performance'] })
    vi.spyOn(Math, 'random').mockReturnValue(0.5)
    celebration.mockClear()
    celebration.reset.mockClear()
    setActivePinia(createPinia())
  })
  afterEach(() => {
    TWEEN.removeAll()
    vi.restoreAllMocks()
    vi.useRealTimers()
  })
  async function showResult() {
    const stores = useStore()
    stores.personConfig.setDefaultPersonList()
    stores.prizeConfig.selectNextAvailablePrize()
    const wrapper = mount(Home, { attachTo: document.body, global: { plugins: [i18n], stubs: { StarsBackground: true, PrizeList: true } } })
    await vi.advanceTimersByTimeAsync(2200)
    await wrapper.find('.btn-enter').trigger('click')
    await vi.advanceTimersByTimeAsync(2200)
    await wrapper.find('.btn-start').trigger('click')
    await wrapper.find('#menu > .btn-end').trigger('click')
    await vi.advanceTimersByTimeAsync(1250)
    expect(wrapper.find('.enStop').exists()).toBe(true)
    return { wrapper, stores }
  }
  it('shows progress immediately, returns promptly and records a double click only once', async () => {
    const { wrapper, stores } = await showResult()
    try {
      const button = wrapper.find<HTMLButtonElement>('.enStop .btn-start').element
      button.click()
      button.click()
      await nextTick()
      expect(wrapper.find('[aria-busy="true"]').text()).toContain('正在准备')
      expect(stores.personConfig.getAlreadyPersonList).toHaveLength(3)
      expect(stores.prizeConfig.getPrizeConfig[0].isUsedCount).toBe(3)
      await vi.advanceTimersByTimeAsync(800)
      expect(wrapper.find('[aria-busy="true"]').exists()).toBe(false)
      expect(wrapper.find('.btn-start').text()).toBe('开始')
      expect(stores.personConfig.getAlreadyPersonList).toHaveLength(3)
    }
    finally { wrapper.unmount() }
  })
  it('starts one celebration for multiple winners and cancels it when leaving the result', async () => {
    const { wrapper, stores } = await showResult()
    try {
      expect(celebration.mock.calls.filter(([options]) => options.spread === 26)).toHaveLength(1)
      const resets = celebration.reset.mock.calls.length
      await wrapper.find('.btn-cancel').trigger('click')
      expect(celebration.reset.mock.calls.length).toBe(resets + 1)
      await vi.advanceTimersByTimeAsync(800)
      expect(stores.personConfig.getAlreadyPersonList).toHaveLength(0)
      expect(stores.prizeConfig.getPrizeConfig[0].isUsedCount).toBe(0)
      expect(wrapper.find('.btn-start').text()).toBe('开始')
    }
    finally { wrapper.unmount() }
  })
})
