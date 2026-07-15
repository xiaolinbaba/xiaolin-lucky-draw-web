// i18n配置
import { createI18n } from 'vue-i18n'
import { DEFAULT_LANGUAGE, DEFAULT_TOP_TITLE, LEGACY_ENGLISH_DEFAULT_TITLE } from '@/constants/app'
import en from './en'
import zhCn from './zhCn'

export type Language = 'en' | 'zhCn'

export const languageList = [
  {
    key: 'zhCn',
    name: '中文',
    flag: 'zh-cn',
  },
  {
    key: 'en',
    name: 'English',
    flag: 'en-us',
  },
]
export const browserLanguage: Language = DEFAULT_LANGUAGE

interface PersistedGlobalConfig {
  language?: Language
  topTitle?: string
  [key: string]: unknown
}

interface PersistedGlobalStore {
  globalConfig?: PersistedGlobalConfig
  [key: string]: unknown
}

function readPersistedGlobalConfig(): PersistedGlobalConfig {
  const storedValue = localStorage.getItem('globalConfig')
  if (!storedValue) {
    return {}
  }

  try {
    const persistedStore = JSON.parse(storedValue) as PersistedGlobalStore
    const globalConfig = persistedStore.globalConfig ?? {}

    // 仅迁移此前自动生成的错误英文默认值，不覆盖用户自定义标题。
    if (globalConfig.topTitle === LEGACY_ENGLISH_DEFAULT_TITLE) {
      globalConfig.topTitle = DEFAULT_TOP_TITLE
      globalConfig.language = DEFAULT_LANGUAGE
      persistedStore.globalConfig = globalConfig
      localStorage.setItem('globalConfig', JSON.stringify(persistedStore))
    }

    return globalConfig
  }
  catch {
    return {}
  }
}

const globalConfig = readPersistedGlobalConfig()
// 创建i18n
const i18n = createI18n({
  locale: globalConfig.language || DEFAULT_LANGUAGE,
  legacy: false,
  messages: {
    zhCn,
    en,
  },
})

export default i18n
