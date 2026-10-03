import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import i18n from '@/locales/i18n'
import EditSeparateDialog from './EditSeparateDialog.vue'

describe('batch dialog drafts', () => {
  it('does not mutate input batches before submitting changed boundaries', async () => {
    const batches = [{ id: 'first', count: 2, isUsedCount: 2 }, { id: 'second', count: 3, isUsedCount: 1 }]
    const original = JSON.stringify(batches)
    const wrapper = mount(EditSeparateDialog, { props: { totalNumber: 0, separatedNumber: batches }, global: { plugins: [i18n] } })
    const dialog = wrapper.find('dialog').element
    dialog.showModal = vi.fn()
    dialog.close = vi.fn()
    await wrapper.setProps({ totalNumber: 5 })
    const boundaries = wrapper.findAll('.separated-number .tooltip')
    await boundaries[0].trigger('click', { button: 0 })
    await boundaries[1].trigger('click', { button: 0 })

    expect(JSON.stringify(batches)).toBe(original)
    expect(wrapper.emitted('submitData')).toBeUndefined()
    await wrapper.find('button').trigger('click')
    expect(wrapper.emitted('submitData')![0][0]).toEqual([
      { id: '1', count: 1, isUsedCount: 0 },
      { id: '2', count: 4, isUsedCount: 0 },
    ])
    expect(JSON.stringify(batches)).toBe(original)
    wrapper.unmount()
  })
})
