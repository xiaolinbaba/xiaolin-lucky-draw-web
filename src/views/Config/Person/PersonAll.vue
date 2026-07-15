<!-- eslint-disable vue/no-parsing-error -->
<script setup lang='ts'>
import type { IPersonConfig } from '@/types/storeType'
import { storeToRefs } from 'pinia'
import { onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import * as XLSX from 'xlsx'
import DaiysuiTable from '@/components/DaiysuiTable/index.vue'
import i18n from '@/locales/i18n'
import useStore from '@/store'
import { getDefaultPersonList } from '@/store/data'
import { addOtherInfo } from '@/utils'
import { readFileBinary } from '@/utils/file'

const { t } = useI18n()
const personConfig = useStore().personConfig
const prizeConfig = useStore().prizeConfig
const { getAllPersonList: allPersonList, getAlreadyPersonList: alreadyPersonList } = storeToRefs(personConfig)
const limitType = '.xlsx,.xls'
const maxExcelFileSize = 10 * 1024 * 1024
const importError = ref('')
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
  if (file.size > maxExcelFileSize) {
    importError.value = t('error.fileTooLarge', { size: 10 })
    input.value = ''
    return
  }

  try {
    const dataBinary = await readFileBinary(file)
    const workBook = XLSX.read(dataBinary, { type: 'array', cellDates: true })
    const firstSheetName = workBook.SheetNames[0]
    const workSheet = firstSheetName ? workBook.Sheets[firstSheetName] : undefined
    if (!workSheet) {
      throw new Error('Workbook does not contain a worksheet')
    }

    const excelData = XLSX.utils.sheet_to_json<Record<string, unknown>>(workSheet, { defval: '' })
    const fieldMapping: Record<string, keyof Pick<IPersonConfig, 'uid' | 'name' | 'department' | 'identity'>> = {
      编号: 'uid',
      姓名: 'name',
      部门: 'department',
      职位: 'identity',
      Number: 'uid',
      Name: 'name',
      Department: 'department',
      Position: 'identity',
    }

    const mappedData = excelData.map((row) => {
      const newRow: Record<string, unknown> = {}
      for (const [key, value] of Object.entries(row)) {
        const mappedKey = fieldMapping[key] || key
        newRow[mappedKey] = value
      }
      return {
        ...newRow,
        uid: String(newRow.uid ?? '').trim(),
        name: String(newRow.name ?? '').trim(),
        department: String(newRow.department ?? '').trim(),
        identity: String(newRow.identity ?? '').trim(),
        avatar: '',
      }
    })

    if (mappedData.length === 0 || mappedData.some(row => !row.uid || !row.name)) {
      throw new Error('Required columns are missing or contain empty values')
    }

    const uniqueUids = new Set(mappedData.map(row => row.uid))
    if (uniqueUids.size !== mappedData.length) {
      throw new Error('Participant numbers must be unique')
    }

    const allData = addOtherInfo(mappedData) as IPersonConfig[]
    // Only replace persisted state after the entire workbook has passed validation.
    personConfig.resetPerson()
    personConfig.addNotPersonList(allData)
    prizeConfig.resetDrawProgress()
  }
  catch (error) {
    console.error('Failed to import participant workbook', error)
    importError.value = t('error.importInvalid')
  }
  finally {
    input.value = ''
  }
}
function exportData() {
  let data = JSON.parse(JSON.stringify(allPersonList.value))
  // 排除一些字段
  for (let i = 0; i < data.length; i++) {
    delete data[i].x
    delete data[i].y
    delete data[i].id
    delete data[i].avatar
    delete data[i].createTime
    delete data[i].updateTime
    delete data[i].prizeId
    // 修改字段名称
    if (data[i].isWin) {
      data[i].isWin = i18n.global.t('data.yes')
    }
    else {
      data[i].isWin = i18n.global.t('data.no')
    }
    // 格式化数组为
    data[i].prizeTime = data[i].prizeTime.join(',')
    data[i].prizeName = data[i].prizeName.join(',')
  }
  let dataString = JSON.stringify(data)
  dataString = dataString
    // 先替换复合字段名，避免 name 是 prizeName 的子串导致表头被破坏
    .replaceAll(/prizeName/g, i18n.global.t('data.prizeName'))
    .replaceAll(/prizeTime/g, i18n.global.t('data.prizeTime'))
    .replaceAll(/uid/g, i18n.global.t('data.number'))
    .replaceAll(/isWin/g, i18n.global.t('data.isWin'))
    .replaceAll(/department/g, i18n.global.t('data.department'))
    .replaceAll(/name/g, i18n.global.t('data.name'))
    .replaceAll(/identity/g, i18n.global.t('data.identity'))

  data = JSON.parse(dataString)

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
onMounted(() => {
})
</script>

<template>
  <dialog id="my_modal_1" ref="resetDataDialog" class="border-none modal">
    <div class="modal-box">
      <h3 class="text-lg font-bold">
        {{ t('dialog.titleTip') }}
      </h3>
      <p class="py-4">
        {{ t('dialog.dialogResetWinner') }}
      </p>
      <div class="modal-action">
        <form method="dialog" class="flex gap-3">
          <!-- if there is a button in form, it will close the modal -->
          <button class="btn" @click="resetDataDialog.close()">
            {{ t('button.cancel') }}
          </button>
          <button class="btn" @click="resetData">
            {{ t('button.confirm') }}
          </button>
        </form>
      </div>
    </div>
  </dialog>
  <dialog id="my_modal_1" ref="delAllDataDialog" class="border-none modal">
    <div class="modal-box">
      <h3 class="text-lg font-bold">
        {{ t('dialog.titleTip') }}
      </h3>
      <p class="py-4">
        {{ t('dialog.dialogDelAllPerson') }}
      </p>
      <div class="modal-action">
        <form method="dialog" class="flex gap-3">
          <!-- if there is a button in form, it will close the modal -->
          <button class="btn" @click="delAllDataDialog.close()">
            {{ t('button.cancel') }}
          </button>
          <button class="btn" @click="deleteAll">
            {{ t('button.confirm') }}
          </button>
        </form>
      </div>
    </div>
  </dialog>
  <div class="min-w-1000px mt-6">
    <div class="flex gap-3">
      <button class="btn btn-error btn-sm" @click="delAllDataDialog.showModal()">
        {{ t('button.allDelete') }}
      </button>
      <div class="tooltip tooltip-bottom" :data-tip="t('tooltip.downloadTemplateTip')">
        <button
          class="btn btn-secondary btn-sm"
          @click="downloadTemplate"
        >
          {{ t('button.downloadTemplate') }}
        </button>
      </div>
      <div class="">
        <label for="explore">

          <div class="tooltip tooltip-bottom" :data-tip="t('tooltip.uploadExcelTip')">
            <input
              id="explore" type="file" class="" style="display: none" :accept="limitType"
              @change="handleFileChange"
            >

            <span class="btn btn-primary btn-sm">{{ t('button.importData') }}</span>
          </div>
        </label>
      </div>
      <button class="btn btn-error btn-sm" @click="resetDataDialog.showModal()">
        {{ t('button.resetData') }}
      </button>
      <button class="btn btn-accent btn-sm" @click="exportData">
        {{ t('button.exportResult') }}
      </button>
      <div>
        <span>{{ t('table.luckyPeopleNumber') }}:</span>
        <span>{{ alreadyPersonList.length }}</span>
        <span>&nbsp;/&nbsp;</span>
        <span>{{ allPersonList.length }}</span>
      </div>
      <div v-if="importError" role="alert" class="alert alert-error py-2">
        {{ importError }}
      </div>
    </div>
    <DaiysuiTable :table-columns="tableColumns" :data="allPersonList" />
  </div>
</template>

<style lang='scss' scoped></style>
