import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import Table from './index.vue'

vi.mock('vue-i18n', () => ({ useI18n: () => ({ t: (key: string) => key }) }))
describe('participant table pagination', () => {
  it('limits rendered rows, keeps actions on their original record and clamps after deletion', async () => {
    const remove = vi.fn()
    const data = Array.from({ length: 51 }, (_, id) => ({ id, name: `Person ${id}` }))
    const wrapper = mount(Table, { props: { data, tableColumns: [{ label: 'Name', props: 'name' }, { actions: [{ label: 'Delete', onClick: remove }] }] } })
    expect(wrapper.findAll('tbody tr')).toHaveLength(50)
    await wrapper.findAll('nav button')[1].trigger('click')
    expect(wrapper.findAll('tbody tr')).toHaveLength(1)
    await wrapper.find('tbody button').trigger('click')
    expect(remove).toHaveBeenCalledWith(data[50])
    await wrapper.setProps({ data: data.slice(0, 50) })
    expect(wrapper.findAll('tbody tr')).toHaveLength(50)
    expect(wrapper.findAll('nav button')[0].attributes('disabled')).toBeDefined()
    wrapper.unmount()
  })
})
