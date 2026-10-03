import { describe, expect, it } from 'vitest'
import { escapeHtml } from './html'

describe('plain-text toast messages', () => {
  it('keeps malicious prize names as text when inserted into an HTML sink', () => {
    const message = '抽取 <img src=x onerror="alert(1)"> & 三等奖'
    const container = document.createElement('div')
    container.innerHTML = escapeHtml(message)

    expect(container.textContent).toBe(message)
    expect(container.querySelector('img')).toBeNull()
  })
})
