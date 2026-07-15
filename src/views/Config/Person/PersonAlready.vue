<!-- eslint-disable vue/no-parsing-error -->
<script setup lang='ts'>
import type { IPersonConfig } from '@/types/storeType'
import { storeToRefs } from 'pinia'
import { useI18n } from 'vue-i18n'
import DaiysuiTable from '@/components/DaiysuiTable/index.vue'
import i18n from '@/locales/i18n'
import useStore from '@/store'

const { t } = useI18n()
const personConfig = useStore().personConfig

const { getAlreadyPersonList: alreadyPersonList } = storeToRefs(personConfig)
// const personList = ref<any[]>(
//     alreadyPersonList
// )

// const deleteAll = () => {
//     personConfig.deleteAllPerson()
// }

function handleMoveNotPerson(row: IPersonConfig) {
  personConfig.moveAlreadyToNot(row)
}

const tableColumnsList = [
  {
    label: i18n.global.t('data.number'),
    props: 'uid',
    sort: true,
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
    label: i18n.global.t('data.prizeName'),
    props: 'prizeName',
    sort: true,
  },
  {
    label: i18n.global.t('data.operation'),
    actions: [
      {
        label: i18n.global.t('data.removePerson'),
        type: 'btn-info',
        onClick: (row: IPersonConfig) => {
          handleMoveNotPerson(row)
        },
      },
    ],
  },
]
</script>

<template>
  <div class="overflow-y-auto">
    <div class="flex items-center justify-start gap-10">
      <div>
        <span>{{ t('table.luckyPeopleNumber') }}：</span>
        <span>{{ alreadyPersonList.length }}</span>
      </div>
    </div>
    <DaiysuiTable :table-columns="tableColumnsList" :data="alreadyPersonList" />
  </div>
</template>

<style lang='scss' scoped></style>
