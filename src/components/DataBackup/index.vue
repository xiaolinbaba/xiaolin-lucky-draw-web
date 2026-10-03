<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import ConfirmDialog from '@/components/ConfirmDialog/index.vue'
import useStore from '@/store'
import { createBackup, downloadBlob, maxBackupSize, restoreBackup, validateBackup } from '@/utils/backup'
import { getRecoveryData, persistenceIssue } from '@/utils/persistence'

const { t } = useI18n()
const stores = useStore()
const confirmDialog = ref<InstanceType<typeof ConfirmDialog>>()
const busy = ref(false)
const error = ref('')
async function exportBackup() {
  busy.value = true
  error.value = ''
  try {
    const blob = await createBackup({ globalConfig: stores.globalConfig.globalConfig }, { personConfig: stores.personConfig.personConfig }, { prizeConfig: stores.prizeConfig.prizeConfig })
    downloadBlob(blob, `luck-backup-${new Date().toISOString().slice(0, 10)}.json`)
  }
  catch { error.value = t('error.backupFailed') }
  finally { busy.value = false }
}
async function importBackup(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file)
    return
  busy.value = true
  error.value = ''
  try {
    if (file.size > maxBackupSize)
      throw new Error('Oversized backup')
    const backup = validateBackup(JSON.parse(await file.text()))
    confirmDialog.value?.open(t('dialog.restoreBackup', { count: backup.people.personConfig.allPersonList.length, prizes: backup.prizes.prizeConfig.prizeList.length }), async () => {
      busy.value = true
      try {
        // Download a complete copy of the current event before replacing it.
        const previous = await createBackup({ globalConfig: stores.globalConfig.globalConfig }, { personConfig: stores.personConfig.personConfig }, { prizeConfig: stores.prizeConfig.prizeConfig })
        downloadBlob(previous, `luck-before-restore-${Date.now()}.json`)
        await restoreBackup(backup)
        window.location.reload()
      }
      finally { busy.value = false }
    })
  }
  catch { error.value = t('error.backupInvalid') }
  finally {
    busy.value = false
    input.value = ''
  }
}
function exportRecovery() {
  downloadBlob(new Blob([JSON.stringify(getRecoveryData())], { type: 'application/json' }), 'luck-recovery.json')
}
</script>

<template>
  <section class="config-section">
    <header class="config-section-header">
      <h2 class="config-section-title">
        {{ t('admin.backup') }}
      </h2>
    </header>
    <div class="config-section-body space-y-3">
      <p class="text-sm text-base-content/65">
        {{ t('admin.backupDescription') }}
      </p>
      <div class="flex flex-wrap gap-3">
        <button class="btn btn-primary btn-sm" :disabled="busy" @click="exportBackup">
          {{ t('admin.exportBackup') }}
        </button>
        <label class="btn btn-secondary btn-outline btn-sm" :class="{ 'btn-disabled': busy }" for="backup-import">{{ t('admin.restoreBackup') }}</label>
        <input id="backup-import" type="file" accept=".json,application/json" class="hidden" :disabled="busy" @change="importBackup">
        <span v-if="busy" class="loading loading-spinner loading-sm" />
      </div>
      <p v-if="error" role="alert" class="text-error">
        {{ error }}
      </p>
      <div v-if="persistenceIssue" role="alert" class="alert alert-warning">
        <span>{{ t(persistenceIssue) }}</span>
        <button class="btn btn-sm" @click="exportRecovery">
          {{ t('admin.exportRecovery') }}
        </button>
      </div>
    </div>
    <ConfirmDialog ref="confirmDialog" />
  </section>
</template>
