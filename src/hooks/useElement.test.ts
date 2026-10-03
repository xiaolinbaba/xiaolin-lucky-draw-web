import type { IPersonConfig } from '@/types/storeType'
import { describe, expect, it, vi } from 'vitest'
import { useElementStyle } from './useElement'

describe('card style updates', () => {
  it('does not accumulate event listeners and uses the latest hover color', () => {
    const element = document.createElement('div')
    element.append(...Array.from({ length: 3 }, () => document.createElement('div')), document.createElement('img'))
    const addListener = vi.spyOn(element, 'addEventListener')
    const person = { name: '<img src=x>', department: '<script>', identity: 'Engineer' } as IPersonConfig
    for (let index = 0; index < 20; index++) {
      useElementStyle(element, person, 0, [], '#ffffff', '#ff0000', { width: 140, height: 200 }, 30)
    }
    useElementStyle(element, person, 0, [], '#ffffff', '#00ff00', { width: 140, height: 200 }, 30, 'lucky')
    element.dispatchEvent(new MouseEvent('mouseenter'))

    expect(addListener).not.toHaveBeenCalled()
    expect(element.style.boxShadow).toBe('0 0 12px rgba(0,255,0,0.75)')
    expect(element.children[1].textContent).toBe(person.name)
    expect(element.querySelector('script')).toBeNull()
  })

  it('does not download avatars when avatar display is disabled', () => {
    const element = document.createElement('div')
    const avatar = document.createElement('img')
    avatar.style.display = 'none'
    element.append(...Array.from({ length: 3 }, () => document.createElement('div')), avatar)
    const person = { avatar: 'https://randomuser.me/api/portraits/men/1.jpg' } as IPersonConfig
    useElementStyle(element, person, 0, [], '#ffffff', '#ff0000', { width: 140, height: 200 }, 30)

    expect(avatar.hasAttribute('src')).toBe(false)
  })
})
