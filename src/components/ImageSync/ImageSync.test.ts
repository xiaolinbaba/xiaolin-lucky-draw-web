import { flushPromises, mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import ImageSync from './index.vue'

const getItem = vi.hoisted(() => vi.fn())
vi.mock('localforage', () => ({ default: { createInstance: () => ({ getItem }) } }))
describe('image changes', () => {
  it('ignores an older storage lookup after the prize image changes', async () => {
    let resolveOld!: (value: string) => void
    getItem.mockReturnValueOnce(new Promise(resolve => resolveOld = resolve))
    const wrapper = mount(ImageSync, { props: { imgItem: { id: 'old', url: 'Storage' } } })
    await wrapper.setProps({ imgItem: { id: 'new', url: '/images/new.png' } })
    await flushPromises()
    expect(wrapper.find('img').attributes('src')).toBe('/images/new.png')
    resolveOld('data:image/png;base64,old')
    await flushPromises()
    expect(wrapper.find('img').attributes('src')).toBe('/images/new.png')
    wrapper.unmount()
  })
  it('handles a failed storage read without showing an old image', async () => {
    getItem.mockRejectedValueOnce(new Error('offline'))
    const wrapper = mount(ImageSync, { props: { imgItem: { id: 'missing', url: 'Storage' } } })
    await flushPromises()
    expect(wrapper.find('img').attributes('src')).toBeUndefined()
    wrapper.unmount()
  })
})
