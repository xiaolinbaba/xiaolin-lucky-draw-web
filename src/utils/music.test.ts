import { describe, expect, it } from 'vitest'
import { bundledMusicList, isBundledMusic, resolveMusicUrl } from './music'

describe('default music source repair', () => {
  it('maps every legacy default to a bundled asset, including encoded names', () => {
    for (const track of bundledMusicList) {
      expect(resolveMusicUrl(`https://to2026.xyz/resource/audio/${track.name}`)).toBe(track.url)
      expect(resolveMusicUrl(`https://to2026.xyz/resource/audio/${encodeURIComponent(track.name)}`)).toBe(track.url)
      expect(isBundledMusic(track.url)).toBe(true)
    }
  })

  it('preserves uploads and custom sources, including unknown tracks on the old host', () => {
    for (const url of ['Storage', 'data:audio/mp3;base64,AAAA', 'https://example.com/audio.mp3', 'https://to2026.xyz/resource/audio/custom.mp3'])
      expect(resolveMusicUrl(url)).toBe(url)
  })
})
