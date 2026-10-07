import type { IMusic } from '@/types/storeType'
import track7 from '@/assets/audio/beautiful-things.mp3'
import track3 from '@/assets/audio/china-atomic.mp3'
import track2 from '@/assets/audio/china-industrial.mp3'
import track9 from '@/assets/audio/dance.mp3'
import track11 from '@/assets/audio/happy-new-year.mp3'
import track8 from '@/assets/audio/hard-to-part.mp3'
import track10 from '@/assets/audio/life.mp3'
import track1 from '@/assets/audio/radetzky-march.mp3'
import track4 from '@/assets/audio/shanghai.mp3'
import track5 from '@/assets/audio/waltz-no-2.mp3'
import track6 from '@/assets/audio/wild-china.mp3'

export const bundledMusicList: IMusic[] = [
  { id: 'radetzky-march', name: 'Radetzky March.mp3', url: track1 },
  { id: 'china-industrial', name: 'Geoff Knorr - China (The Industrial Era).ogg', url: track2 },
  { id: 'china-atomic', name: 'Geoff Knorr&Phill Boucher - China (The Atomic Era).ogg', url: track3 },
  { id: 'shanghai', name: 'Shanghai.mp3', url: track4 },
  { id: 'waltz-no-2', name: 'Waltz No.2.mp3', url: track5 },
  { id: 'wild-china', name: 'WildChinaTheme.mp3', url: track6 },
  { id: 'beautiful-things', name: '边程&房东的猫 - 美好事物-再遇少年.ogg', url: track7 },
  { id: 'hard-to-part', name: '大乔小乔 - 相见难别亦难.ogg', url: track8 },
  { id: 'dance', name: '你要跳舞吗-新裤子.mp3', url: track9 },
  { id: 'life', name: '生命-声音玩具.mp3', url: track10 },
  { id: 'happy-new-year', name: '与非门 - Happy New Year.ogg', url: track11 },
]

// Repair only known defaults; uploaded tracks and custom URLs keep their sources.
export function resolveMusicUrl(url: string): string {
  try {
    const source = new URL(url)
    if (source.origin === 'https://to2026.xyz') {
      const path = decodeURIComponent(source.pathname)
      const track = bundledMusicList.find(item => path === `/resource/audio/${item.name}`)
      if (track)
        return track.url
    }
  }
  catch { /* Relative asset paths and the Storage marker are already valid. */ }
  return url
}

export function isBundledMusic(url: string): boolean {
  return bundledMusicList.some(track => track.url === resolveMusicUrl(url))
}
