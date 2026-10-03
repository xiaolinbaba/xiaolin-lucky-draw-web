<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const dialog = ref<HTMLDialogElement>()
const message = ref('')
const busy = ref(false)
const error = ref('')
let action: (() => void | Promise<void>) | undefined
function open(text: string, callback: () => void | Promise<void>) {
  message.value = text
  action = callback
  error.value = ''
  dialog.value?.showModal()
}
async function confirm() {
  if (busy.value || !action)
    return
  busy.value = true
  try {
    await action()
    dialog.value?.close()
    action = undefined
  }
  catch (failure) {
    error.value = t(failure instanceof Error && failure.message === 'rollbackFailed' ? 'error.restoreRollback' : 'error.storageFailed')
  }
  finally {
    busy.value = false
  }
}
defineExpose({ open })
</script>

<template>
  <dialog ref="dialog" class="border-none modal" @cancel="busy && $event.preventDefault()" @close="action = undefined">
    <div class="modal-box">
      <h3 class="text-lg font-bold">
        {{ t('dialog.titleTip') }}
      </h3>
      <p class="py-4">
        {{ message }}
      </p>
      <p v-if="error" role="alert" class="text-error">
        {{ error }}
      </p>
      <div class="modal-action">
        <button class="btn btn-ghost" :disabled="busy" @click="dialog?.close()">
          {{ t('button.cancel') }}
        </button>
        <button class="btn btn-warning" :disabled="busy" @click="confirm">
          <span v-if="busy" class="loading loading-spinner loading-sm" />
          {{ t('button.confirm') }}
        </button>
      </div>
    </div>
  </dialog>
</template>
