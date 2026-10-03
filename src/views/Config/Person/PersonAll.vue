<!-- eslint-disable vue/no-parsing-error -->
<script setup lang='ts'>
import type { IPersonConfig } from '@/types/storeType'
import { storeToRefs } from 'pinia'
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import * as XLSX from 'xlsx'
import ConfirmDialog from '@/components/ConfirmDialog/index.vue'
import DaiysuiTable from '@/components/DaiysuiTable/index.vue'
import i18n from '@/locales/i18n'
import useStore from '@/store'
import { getDefaultPersonList } from '@/store/data'
import { addOtherInfo } from '@/utils'
import { readFileBinary } from '@/utils/file'
import { importPeople } from '@/utils/importWorker'
import { buildPersonExportRows } from '@/utils/personExport'

const { t } = useI18n()
const personConfig = useStore().personConfig
const prizeConfig = useStore().prizeConfig
const { getAllPersonList: allPersonList, getAlreadyPersonList: alreadyPersonList } = storeToRefs(personConfig)
const limitType = '.xlsx,.xls'
const maxExcelFileSize = 10 * 1024 * 1024
const importError = ref('')
const importing = ref(false)
const confirmDialog = ref<InstanceType<typeof ConfirmDialog>>()
// const personList = ref<any[]>([])

const resetDataDialog = ref()
const delAllDataDialog = ref()

async function handleFileChange(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  importError.value = ''

  if (!file) {
    return
  }
  if (importing.value)
    return
  if (file.size > maxExcelFileSize) {
    importError.value = t('error.fileTooLarge', { size: 10 })
    input.value = ''
    return
  }

  importing.value = true
  try {
    const dataBinary = await readFileBinary(file)
    const mappedData = await importPeople(dataBinary)
    const allData = addOtherInfo(mappedData) as IPersonConfig[]
    const replace = () => {
      personConfig.resetPerson()
      personConfig.addNotPersonList(allData)
      personConfig.updatePersonLayout(useStore().globalConfig.getRowCount)
      prizeConfig.resetDrawProgress()
    }
    if (allPersonList.value.length) {
      confirmDialog.value?.open(t('dialog.replacePeople', { count: allData.length }), replace)
    }
    else {
      replace()
    }
  }
  catch (error) {
    console.error('Failed to import participant workbook', error)
    importError.value = t(`error.${error instanceof Error && ['importLimit', 'importTimeout'].includes(error.message) ? error.message : 'importInvalid'}`)
  }
  finally {
    importing.value = false
    input.value = ''
  }
}
function exportData() {
  const data = buildPersonExportRows(allPersonList.value, key => i18n.global.t(key))
  if (data.length > 0) {
    const dataBinary = XLSX.utils.json_to_sheet(data)
    const dataBinaryBinary = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(dataBinaryBinary, dataBinary, 'Sheet1')
    XLSX.writeFile(dataBinaryBinary, 'data.xlsx')
  }
}

function resetData() {
  personConfig.resetAlreadyPerson()
  // 同步重置奖项抽取进度（否则首页仍显示 3/3、2/2 等已抽完状态）
  prizeConfig.resetDrawProgress()
}

function deleteAll() {
  personConfig.deleteAllPerson()
  prizeConfig.resetDrawProgress()
}

function delPersonItem(row: IPersonConfig) {
  personConfig.deletePerson(row)
}

// 下载模板，使用默认人员信息
function downloadTemplate() {
  // 获取默认人员列表
  const defaultPersonList = getDefaultPersonList(50)

  // 准备导出数据，只保留需要的字段
  const templateData = defaultPersonList.map((person) => {
    return {
      [i18n.global.t('data.number')]: person.uid,
      [i18n.global.t('data.name')]: person.name,
      [i18n.global.t('data.department')]: person.department,
      [i18n.global.t('data.identity')]: person.identity,
    }
  })

  // 生成 Excel 文件
  const worksheet = XLSX.utils.json_to_sheet(templateData)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1')
  XLSX.writeFile(workbook, t('data.xlsxName'))
}

const tableColumns = [
  {
    label: i18n.global.t('data.number'),
    props: 'uid',
  },
  {
    label: i18n.global.t('data.name'),
    props: 'name',
  },
  {
    label: i18n.global.t('data.department'),
    props: 'department',
  },
  {
    label: i18n.global.t('data.identity'),
    props: 'identity',
  },
  {
    label: i18n.global.t('data.isWin'),
    props: 'isWin',
    formatValue(row: IPersonConfig) {
      return row.isWin ? i18n.global.t('data.yes') : i18n.global.t('data.no')
    },
  },
  {
    label: i18n.global.t('data.operation'),
    actions: [
      // {
      //     label: '编辑',
      //     type: 'btn-info',
      //     onClick: (row: any) => {
      //         delPersonItem(row)
      //     }
      // },
      {
        label: i18n.global.t('data.delete'),
        type: 'btn-error',
        onClick: (row: IPersonConfig) => {
          delPersonItem(row)
        },
      },

    ],
  },
]
</script>

<template>
  <div class="config-page">
    <dialog ref="resetDataDialog" class="border-none modal">
      <div class="modal-box">
        <h3 class="text-lg font-bold">
          {{ t('dialog.titleTip') }}
        </h3>
        <p class="py-4">
          {{ t('dialog.dialogResetWinner') }}
        </p>
        <div class="modal-action">
          <form method="dialog" class="flex gap-3">
            <button class="btn btn-ghost" @click="resetDataDialog.close()">
              {{ t('button.cancel') }}
            </button>
            <button class="btn btn-warning" @click="resetData">
              {{ t('button.confirm') }}
            </button>
          </form>
        </div>
      </div>
    </dialog>

    <dialog ref="delAllDataDialog" class="border-none modal">
      <div class="modal-box">
        <h3 class="text-lg font-bold">
          {{ t('dialog.titleTip') }}
        </h3>
        <p class="py-4">
          {{ t('dialog.dialogDelAllPerson') }}
        </p>
        <div class="modal-action">
          <form method="dialog" class="flex gap-3">
            <button class="btn btn-ghost" @click="delAllDataDialog.close()">
              {{ t('button.cancel') }}
            </button>
            <button class="btn btn-error" @click="deleteAll">
              {{ t('button.confirm') }}
            </button>
          </form>
        </div>
      </div>
    </dialog>

    <div class="config-toolbar">
      <span class="tooltip tooltip-bottom" :data-tip="t('tooltip.uploadExcelTip')">
        <label for="person-import" class="btn btn-primary btn-sm cursor-pointer">
          {{ t('button.importData') }}
        </label>
      </span>
      <input id="person-import" type="file" class="hidden" :accept="limitType" :disabled="importing" @change="handleFileChange">

      <span class="tooltip tooltip-bottom" :data-tip="t('tooltip.downloadTemplateTip')">
        <button class="btn btn-secondary btn-outline btn-sm" @click="downloadTemplate">
          {{ t('button.downloadTemplate') }}
        </button>
      </span>
      <button class="btn btn-accent btn-outline btn-sm" @click="exportData">
        {{ t('button.exportResult') }}
      </button>

      <div class="hidden h-6 w-px bg-base-content/10 sm:block" />
      <button class="btn btn-warning btn-outline btn-sm" @click="resetDataDialog.showModal()">
        {{ t('button.resetData') }}
      </button>
      <button class="btn btn-error btn-outline btn-sm" @click="delAllDataDialog.showModal()">
        {{ t('button.allDelete') }}
      </button>

      <div class="ml-auto rounded-lg bg-base-100 px-3 py-2 text-sm shadow-sm">
        <span class="text-base-content/60">{{ t('table.luckyPeopleNumber') }}</span>
        <strong class="ml-2 tabular-nums">{{ alreadyPersonList.length }} / {{ allPersonList.length }}</strong>
      </div>
    </div>

    <p v-if="importing" role="status" class="flex items-center gap-2 text-sm">
      <span class="loading loading-spinner loading-sm" />{{ t('admin.importing') }}
    </p>
    <p class="text-sm text-base-content/60">
      {{ t('admin.importLimits') }}
    </p>
    <div v-if="importError" role="alert" class="alert alert-error text-sm">
      {{ importError }}
    </div>

    <section class="config-section">
      <DaiysuiTable :table-columns="tableColumns" :data="allPersonList" />
    </section>
    <ConfirmDialog ref="confirmDialog" />
  </div>
</template>

<style lang='scss' scoped></style>
