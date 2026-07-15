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
  <div class="config-page">
    <div class="config-toolbar">
      <div class="rounded-lg bg-base-100 px-3 py-2 text-sm shadow-sm">
        <span class="text-base-content/60">{{ t('table.luckyPeopleNumber') }}</span>
        <strong class="ml-2 tabular-nums">{{ alreadyPersonList.length }}</strong>
      </div>
    </div>
    <section class="config-section">
      <DaiysuiTable :table-columns="tableColumnsList" :data="alreadyPersonList" />
    </section>
  </div>
</template>

<style lang='scss' scoped></style>
