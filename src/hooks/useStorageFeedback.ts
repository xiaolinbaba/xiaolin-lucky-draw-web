import { onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'

export function useStorageFeedback() {
  const { t } = useI18n()
  const storageError = ref('')
  const storageUsage = ref('')
  const busy = ref(false)
  async function refreshUsage() {
    try {
      const estimate = await navigator.storage?.estimate()
      if (estimate?.quota) {
        storageUsage.value = t('admin.storageUsage', {
          used: Math.ceil((estimate.usage || 0) / 1024 / 1024),
          total: Math.floor(estimate.quota / 1024 / 1024),
        })
      }
    }
    catch { /* Storage estimates are optional. */ }
  }
  async function run(action: () => Promise<void>) {
    if (busy.value)
      return
    busy.value = true
    storageError.value = ''
    try {
      await action()
    }
    catch (error) {
      storageError.value = t(error instanceof Error && error.name === 'QuotaExceededError' ? 'error.storageFull' : 'error.storageFailed')
      throw error
    }
    finally {
      busy.value = false
      void refreshUsage()
    }
  }
  onMounted(() => void refreshUsage())
  return { storageError, storageUsage, busy, run }
}
