<script setup lang='ts'>
import type { IPrizeConfig } from '@/types/storeType'
import localforage from 'localforage'
import { storeToRefs } from 'pinia'
import { onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import EditSeparateDialog from '@/components/NumberSeparate/EditSeparateDialog.vue'
import i18n from '@/locales/i18n'
import useStore from '@/store'

const { t } = useI18n()
const imageDbStore = localforage.createInstance({
  name: 'imgStore',
})
const prizeConfig = useStore().prizeConfig
const globalConfig = useStore().globalConfig
const { getPrizeConfig: localPrizeList, getCurrentPrize: currentPrize } = storeToRefs(prizeConfig)

const { getImageList: localImageList } = storeToRefs(globalConfig)
const prizeList = ref(localPrizeList)
const imgList = ref<any[]>([])

const selectedPrize = ref<IPrizeConfig | null>()

function addPrize() {
  const defaultPrizeCOnfig: IPrizeConfig = {
    id: new Date().getTime().toString(),
    name: i18n.global.t('data.prizeName'),
    sort: 0,
    isAll: false,
    count: 1,
    isUsedCount: 0,
    picture: {
      id: '',
      name: '',
      url: '',
    },
    separateCount: {
      enable: false,
      countList: [],
    },
    desc: '',
    isUsed: false,
    isShow: true,
    frequency: 1,
  }
  prizeConfig.addPrizeConfig(defaultPrizeCOnfig)
}

function selectPrize(item: IPrizeConfig) {
  selectedPrize.value = item
  selectedPrize.value.isUsedCount = 0
  selectedPrize.value.isUsed = false

  if (selectedPrize.value.separateCount.countList.length > 1) {
    return
  }
  selectedPrize.value.separateCount = {
    enable: true,
    countList: [
      {
        id: '0',
        count: item.count,
        isUsedCount: 0,
      },
    ],
  }
}

function changePrizeStatus(item: IPrizeConfig) {
  // if (item.isUsed == true) {
  //     item.isUsedCount = 0;
  //     if (item.separateCount && item.separateCount.countList.length) {
  //         item.separateCount.countList.forEach((countItem: any) => {
  //             countItem.isUsedCount = 0;
  //         })
  //     }
  // }
  // else {
  //     item.isUsedCount = item.count;
  //     if (item.separateCount && item.separateCount.countList.length) {
  //         item.separateCount.countList.forEach((countItem: any) => {
  //             countItem.isUsedCount = countItem.count;
  //         })
  //     }
  // }
  item.isUsed ? item.isUsedCount = 0 : item.isUsedCount = item.count
  item.separateCount.countList = []
  item.isUsed = !item.isUsed
}

function changePrizePerson(item: IPrizeConfig) {
  let indexPrize = -1
  for (let i = 0; i < prizeList.value.length; i++) {
    if (prizeList.value[i].id === item.id) {
      indexPrize = i
      break
    }
  }
  if (indexPrize > -1) {
    prizeList.value[indexPrize].separateCount.countList = []
    prizeList.value[indexPrize].isUsed ? prizeList.value[indexPrize].isUsedCount = prizeList.value[indexPrize].count : prizeList.value[indexPrize].isUsedCount = 0
  }
}
function submitData(value: any) {
  selectedPrize.value!.separateCount.countList = value
  selectedPrize.value = null
}
function resetDefault() {
  prizeConfig.resetDefault()
}

async function getImageDbStore() {
  const keys = await imageDbStore.keys()
  if (keys.length > 0) {
    imageDbStore.iterate((value, key) => {
      imgList.value.push({
        key,
        value,
      })
    })
  }
}

function sort(item: IPrizeConfig, isUp: number) {
  const itemIndex = prizeList.value.indexOf(item)
  if (isUp === 1) {
    prizeList.value.splice(itemIndex, 1)
    prizeList.value.splice(itemIndex - 1, 0, item)
  }
  else {
    prizeList.value.splice(itemIndex, 1)
    prizeList.value.splice(itemIndex + 1, 0, item)
  }
}
function delItem(item: IPrizeConfig) {
  prizeConfig.deletePrizeConfig(item.id)
}
async function delAll() {
  await prizeConfig.deleteAllPrizeConfig()
}
onMounted(() => {
  getImageDbStore()
})
watch(() => prizeList.value, (val: IPrizeConfig[]) => {
  prizeConfig.setPrizeConfig(val)
}, { deep: true })
</script>

<template>
  <div class="config-page">
    <div class="config-toolbar">
      <button class="btn btn-primary btn-sm" @click="addPrize">
        {{ t('button.add') }}
      </button>
      <button class="btn btn-warning btn-outline btn-sm" @click="resetDefault">
        {{ t('button.resetDefault') }}
      </button>
      <button class="btn btn-error btn-outline btn-sm" @click="delAll">
        {{ t('button.allDelete') }}
      </button>
      <span class="ml-auto text-sm text-base-content/60">{{ t('admin.itemCount', { count: prizeList.length }) }}</span>
    </div>

    <div v-if="prizeList.length === 0" class="config-section config-empty">
      {{ t('table.noneData') }}
    </div>
    <ul v-else class="m-0 grid gap-4 p-0">
      <li
        v-for="item in prizeList" :key="item.id" class="config-section"
        :class="String(currentPrize.id) === String(item.id) ? 'border-primary' : ''"
      >
        <header class="config-section-header">
          <div class="flex min-w-0 items-center gap-2">
            <div class="join shrink-0">
              <button
                class="btn btn-ghost btn-xs join-item" :disabled="prizeList.indexOf(item) === 0"
                :aria-label="t('tooltip.edit')" @click="sort(item, 1)"
              >
                <svg-icon name="up" class="h-4 w-4" />
              </button>
              <button
                class="btn btn-ghost btn-xs join-item" :disabled="prizeList.indexOf(item) === prizeList.length - 1"
                :aria-label="t('tooltip.edit')" @click="sort(item, 0)"
              >
                <svg-icon name="down" class="h-4 w-4" />
              </button>
            </div>
            <strong class="truncate">{{ item.name || t('data.prizeName') }}</strong>
            <span v-if="String(currentPrize.id) === String(item.id)" class="badge badge-primary badge-sm whitespace-nowrap">
              {{ t('admin.current') }}
            </span>
          </div>
          <button class="btn btn-error btn-ghost btn-xs" @click="delItem(item)">
            {{ t('button.delete') }}
          </button>
        </header>

        <div class="config-section-body config-form-grid">
          <label class="config-field md:col-span-2">
            <span class="label"><span class="label-text">{{ t('table.prizeName') }}</span></span>
            <input v-model="item.name" type="text" :placeholder="t('placeHolder.name')" class="input input-bordered w-full">
          </label>

          <label class="config-field">
            <span class="label"><span class="label-text">{{ t('table.numberParticipants') }}</span></span>
            <input
              v-model="item.count" type="number" :placeholder="t('placeHolder.winnerCount')" class="input input-bordered w-full"
              @change="changePrizePerson(item)"
            >
            <span class="mt-2 flex items-center gap-3 text-xs text-base-content/60">
              <progress class="progress progress-primary h-1.5 flex-1" :value="item.isUsedCount" :max="item.count" />
              <span class="tabular-nums">{{ item.isUsedCount }}/{{ item.count }}</span>
            </span>
          </label>

          <label class="config-field">
            <span class="label"><span class="label-text">{{ t('table.image') }}</span></span>
            <select v-model="item.picture" class="select select-bordered w-full">
              <option v-if="item.picture.id" :value="{ id: '', name: '', url: '' }">{{ t('admin.none') }}</option>
              <option disabled>{{ t('table.selectPicture') }}</option>
              <option v-for="picItem in localImageList" :key="picItem.id" :value="picItem">{{ picItem.name }}</option>
            </select>
          </label>

          <div class="config-field">
            <span class="label"><span class="label-text">{{ t('table.fullParticipation') }}</span></span>
            <label class="flex min-h-10 cursor-pointer items-center justify-between rounded-lg border border-base-content/10 px-3">
              <span class="text-sm text-base-content/65">{{ item.isAll ? t('data.yes') : t('data.no') }}</span>
              <input type="checkbox" :checked="item.isAll" class="toggle toggle-secondary" @change="item.isAll = !item.isAll">
            </label>
          </div>

          <div class="config-field">
            <span class="label"><span class="label-text">{{ t('table.isDone') }}</span></span>
            <label class="flex min-h-10 cursor-pointer items-center justify-between rounded-lg border border-base-content/10 px-3">
              <span class="text-sm text-base-content/65">{{ item.isUsed ? t('data.yes') : t('data.no') }}</span>
              <input type="checkbox" :checked="item.isUsed" class="toggle toggle-secondary" @change="changePrizeStatus(item)">
            </label>
          </div>

          <div v-if="item.separateCount" class="config-field md:col-span-2 xl:col-span-1">
            <span class="label"><span class="label-text">{{ t('table.onceNumber') }}</span></span>
            <button class="btn min-h-10 h-auto justify-start border-base-content/15 bg-base-100 px-3 py-1.5 font-normal" @click="selectPrize(item)">
              <span v-if="item.separateCount.countList.length" class="flex flex-wrap gap-2">
                <span v-for="se in item.separateCount.countList" :key="se.id" class="badge badge-outline gap-1 whitespace-nowrap">
                  <strong>{{ se.count }}</strong>
                  <span class="text-base-content/55">{{ se.isUsedCount }}/{{ se.count }}</span>
                </span>
              </span>
              <span v-else>{{ t('button.setting') }}</span>
            </button>
          </div>
        </div>
      </li>
    </ul>
    <EditSeparateDialog
      :total-number="selectedPrize?.count" :separated-number="selectedPrize?.separateCount.countList"
      @submit-data="submitData"
    />
  </div>
</template>

<style lang='scss' scoped></style>
