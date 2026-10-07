import { ref } from 'vue'
import { useI18n } from 'vue-i18n'

export function useStorageFeedback() {
  const { t } = useI18n()
  const storageError = ref('')
  const busy = ref(false)
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
    }
  }
  return { storageError, busy, run }
}
