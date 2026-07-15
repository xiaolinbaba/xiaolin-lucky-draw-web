<script setup lang='ts'>
import daisyuiThemes from 'daisyui/src/theming/themes'

import localforage from 'localforage'
import { storeToRefs } from 'pinia'
import { ref, watch } from 'vue'
import { ColorPicker } from 'vue3-colorpicker'
import { useI18n } from 'vue-i18n'
import zod from 'zod'
import i18n, { languageList } from '@/locales/i18n'
import useStore from '@/store'
import { themeChange } from '@/utils'
import { isHex, isRgbOrRgba } from '@/utils/color'
import PatternSetting from './components/PatternSetting.vue'
import 'vue3-colorpicker/style.css'

const { t } = useI18n()
const globalConfig = useStore().globalConfig
const personConfig = useStore().personConfig
const prizeConfig = useStore().prizeConfig
const { getTopTitle: topTitle, getTheme: localTheme, getPatterColor: patternColor, getPatternList: patternList, getCardColor: cardColor, getLuckyColor: luckyCardColor, getTextColor: textColor, getCardSize: cardSize, getTextSize: textSize, getRowCount: rowCount, getIsShowPrizeList: isShowPrizeList, getLanguage: userLanguage, getBackground: backgroundImage, getImageList: imageList,
} = storeToRefs(globalConfig)
const { getAlreadyPersonList: alreadyPersonList, getNotPersonList: notPersonList } = storeToRefs(personConfig)
const resetDataDialogRef = ref()
interface ThemeDaType {
  [key: string]: any
}
const isRowCountChange = ref(0) // 0未改变，1改变,2加载中
const themeValue = ref(localTheme.value.name)
const topTitleValue = ref(structuredClone(topTitle.value))
const cardColorValue = ref(structuredClone(cardColor.value))
const luckyCardColorValue = ref(structuredClone(luckyCardColor.value))
const textColorValue = ref(structuredClone(textColor.value))
const cardSizeValue = ref(structuredClone(cardSize.value))
const textSizeValue = ref(structuredClone(textSize.value))
const rowCountValue = ref(structuredClone(rowCount.value))
const languageValue = ref(structuredClone(userLanguage.value))
const isShowPrizeListValue = ref(structuredClone(isShowPrizeList.value))
const patternColorValue = ref(structuredClone(patternColor.value))
const themeList = ref(Object.keys(daisyuiThemes))
const daisyuiThemeList = ref<ThemeDaType>(daisyuiThemes)
const backgroundImageValue = ref(backgroundImage.value)
const formData = ref({
  rowCount: rowCountValue,
})
const formErr = ref({
  rowCount: '',
})
const schema = zod.object({
  rowCount: zod.number({
    required_error: i18n.global.t('error.require'),
    invalid_type_error: i18n.global.t('error.requireNumber'),
  })
    .min(1, i18n.global.t('error.minNumber1'))
    .max(100, i18n.global.t('error.maxNumber100')),
  // 格式化

})
type ValidatePayload = zod.infer<typeof schema>
const payload: ValidatePayload = {
  rowCount: formData.value.rowCount,
}
function parseSchema(props: ValidatePayload) {
  return schema.parseAsync(props)
}

function resetPersonLayout() {
  isRowCountChange.value = 2
  setTimeout(() => {
    const alreadyLen = alreadyPersonList.value.length
    const notLen = notPersonList.value.length
    if (alreadyLen <= 0 && notLen <= 0) {
      isRowCountChange.value = 0
      return
    }
    const allPersonList = alreadyPersonList.value.concat(notPersonList.value)
    const newAlreadyPersonList = allPersonList.slice(0, alreadyLen)
    const newNotPersonList = allPersonList.slice(alreadyLen, notLen + alreadyLen)
    personConfig.deleteAllPerson()
    personConfig.addNotPersonList(newNotPersonList)
    personConfig.addAlreadyPersonList(newAlreadyPersonList, null)

    isRowCountChange.value = 0
  }, 1000)
}

function clearPattern() {
  globalConfig.setPatternList([] as number[])
}
function resetPattern() {
  globalConfig.resetPatternList()
}

async function resetData() {
  globalConfig.reset()
  personConfig.reset()
  prizeConfig.resetDefault()
  await Promise.allSettled([
    localforage.createInstance({ name: 'imgStore' }).clear(),
    localforage.createInstance({ name: 'audioStore' }).clear(),
  ])
  // 同时清理持久化缓存，避免旧数据在 reload 后被重新 hydrate
  localStorage.removeItem('globalConfig')
  localStorage.removeItem('personConfig')
  localStorage.removeItem('prizeConfig')
  // 刷新页面
  window.location.reload()
}

// const handleChangeShowFields = (fieldItem: any) => {
//     formData.value.showField.map((item) => {
//         if (item.label === fieldItem.label) {
//             item.value = !item.value
//         }
//     })
// }

watch(() => formData.value.rowCount, () => {
  payload.rowCount = formData.value.rowCount
  parseSchema(payload).then((res) => {
    if (res.rowCount) {
      formErr.value.rowCount = ''
      isRowCountChange.value = 1
      globalConfig.setRowCount(res.rowCount)
    }
  }).catch((err) => {
    formErr.value.rowCount = err.issues[0].message
  })
})

watch(topTitleValue, (val) => {
  globalConfig.setTopTitle(val)
})
watch(themeValue, (val: any) => {
  const selectedThemeDetail = daisyuiThemeList.value[val]
  globalConfig.setTheme({ name: val, detail: selectedThemeDetail })
  themeChange(val)
  if (selectedThemeDetail.primary && (isHex(selectedThemeDetail.primary) || isRgbOrRgba(selectedThemeDetail.primary))) {
    globalConfig.setCardColor(selectedThemeDetail.primary)
  }
}, { deep: true })

watch(cardColorValue, (val: string) => {
  globalConfig.setCardColor(val)
}, { deep: true })
watch(luckyCardColorValue, (val: string) => {
  globalConfig.setLuckyCardColor(val)
}, { deep: true })
watch(patternColorValue, (val: string) => {
  globalConfig.setPatterColor(val)
})
watch(textColorValue, (val: string) => {
  globalConfig.setTextColor(val)
}, { deep: true })

watch(cardSizeValue, (val: { width: number, height: number }) => {
  globalConfig.setCardSize(val)
}, { deep: true })

watch(isShowPrizeListValue, () => {
  globalConfig.setIsShowPrizeList(isShowPrizeListValue.value)
})
watch(backgroundImageValue, (val) => {
  globalConfig.setBackground(val)
})
watch(languageValue, (val) => {
  globalConfig.setLanguage(val)
})
</script>

<template>
  <div class="config-page">
    <dialog ref="resetDataDialogRef" class="border-none modal">
      <div class="modal-box">
        <h3 class="text-lg font-bold">
          {{ t('dialog.titleTip') }}
        </h3>
        <p class="py-4">
          {{ t('dialog.dialogResetAllData') }}
        </p>
        <div class="modal-action">
          <form method="dialog" class="flex gap-3">
            <button class="btn btn-ghost" @click="resetDataDialogRef.close()">
              {{ t('button.cancel') }}
            </button>
            <button class="btn btn-error" @click="resetData">
              {{ t('button.confirm') }}
            </button>
          </form>
        </div>
      </div>
    </dialog>

    <section class="config-section">
      <header class="config-section-header">
        <h2 class="config-section-title">
          {{ t('admin.section.basicSettings') }}
        </h2>
        <button class="btn btn-error btn-outline btn-sm" @click="resetDataDialogRef.showModal()">
          {{ t('button.resetAllData') }}
        </button>
      </header>
      <div class="config-section-body config-form-grid">
        <label class="config-field">
          <span class="label"><span class="label-text">{{ t('table.title') }}</span></span>
          <input v-model="topTitleValue" type="text" :placeholder="t('placeHolder.enterTitle')" class="input input-bordered w-full">
        </label>

        <label class="config-field">
          <span class="label"><span class="label-text">{{ t('table.columnNumber') }}</span></span>
          <div class="flex items-center gap-2">
            <input v-model="formData.rowCount" type="number" class="input input-bordered min-w-0 flex-1">
            <span class="tooltip" :data-tip="t('tooltip.resetLayout')">
              <button class="btn btn-primary btn-sm whitespace-nowrap" :disabled="isRowCountChange !== 1" @click.prevent="resetPersonLayout">
                <span>{{ t('button.setLayout') }}</span>
                <span v-show="isRowCountChange === 2" class="loading loading-ring loading-sm" />
              </button>
            </span>
          </div>
          <span v-if="formErr.rowCount" class="mt-1 text-sm text-error">{{ formErr.rowCount }}</span>
        </label>

        <label class="config-field">
          <span class="label"><span class="label-text">{{ t('table.language') }}</span></span>
          <select v-model="languageValue" data-choose-theme class="select select-bordered w-full">
            <option v-for="item in languageList" :key="item.key" :value="item.key">{{ item.name }}</option>
          </select>
        </label>

        <label class="config-field">
          <span class="label"><span class="label-text">{{ t('table.theme') }}</span></span>
          <select v-model="themeValue" data-choose-theme class="select select-bordered w-full">
            <option v-for="item in themeList" :key="item" :value="item">{{ item }}</option>
          </select>
        </label>

        <label class="config-field md:col-span-2">
          <span class="label"><span class="label-text">{{ t('table.backgroundImage') }}</span></span>
          <select v-model="backgroundImageValue" data-choose-theme class="select select-bordered w-full">
            <option v-for="item in [{ name: t('admin.none'), url: '', id: '' }, ...imageList]" :key="item.id" :value="item">
              {{ item.name }}
            </option>
          </select>
        </label>
      </div>
    </section>

    <section class="config-section">
      <header class="config-section-header">
        <h2 class="config-section-title">
          {{ t('admin.section.visualSettings') }}
        </h2>
      </header>
      <div class="config-section-body config-form-grid">
        <label class="config-field">
          <span class="label"><span class="label-text">{{ t('table.cardColor') }}</span></span>
          <ColorPicker v-model="cardColorValue" v-model:pure-color="cardColorValue" />
        </label>
        <label class="config-field">
          <span class="label"><span class="label-text">{{ t('table.winnerColor') }}</span></span>
          <ColorPicker v-model="luckyCardColorValue" v-model:pure-color="luckyCardColorValue" />
        </label>
        <label class="config-field">
          <span class="label"><span class="label-text">{{ t('table.textColor') }}</span></span>
          <ColorPicker v-model="textColorValue" v-model:pure-color="textColorValue" />
        </label>
        <label class="config-field">
          <span class="label"><span class="label-text">{{ t('table.cardWidth') }}</span></span>
          <input v-model="cardSizeValue.width" type="number" class="input input-bordered w-full">
        </label>
        <label class="config-field">
          <span class="label"><span class="label-text">{{ t('table.cardHeight') }}</span></span>
          <input v-model="cardSizeValue.height" type="number" class="input input-bordered w-full">
        </label>
        <label class="config-field">
          <span class="label"><span class="label-text">{{ t('table.textSize') }}</span></span>
          <input v-model="textSizeValue" type="number" class="input input-bordered w-full">
        </label>
      </div>
    </section>

    <section class="config-section">
      <header class="config-section-header">
        <h2 class="config-section-title">
          {{ t('admin.section.patternSettings') }}
        </h2>
        <div class="flex flex-wrap gap-2">
          <button class="btn btn-ghost btn-sm" @click.stop="clearPattern">
            {{ t('button.clearPattern') }}
          </button>
          <span class="tooltip" :data-tip="t('tooltip.defaultLayout')">
            <button class="btn btn-secondary btn-sm" @click="resetPattern">{{ t('button.DefaultPattern') }}</button>
          </span>
        </div>
      </header>
      <div class="config-section-body space-y-3">
        <label class="config-field max-w-xs">
          <span class="label"><span class="label-text">{{ t('table.highlightColor') }}</span></span>
          <ColorPicker v-model="patternColorValue" v-model:pure-color="patternColorValue" />
        </label>
        <div class="overflow-x-auto rounded-lg bg-base-200/50 p-3">
          <div class="w-max min-w-full">
            <PatternSetting
              :row-count="rowCount" :card-color="cardColor" :pattern-color="patternColor"
              :pattern-list="patternList"
              @update:pattern-list="globalConfig.setPatternList"
            />
          </div>
        </div>
        <label class="flex cursor-pointer items-center justify-between gap-4 rounded-lg border border-base-content/10 px-4 py-3">
          <span class="font-medium">{{ t('table.alwaysDisplay') }}</span>
          <input
            type="checkbox" :checked="isShowPrizeListValue" class="checkbox checkbox-secondary"
            @change="isShowPrizeListValue = !isShowPrizeListValue"
          >
        </label>
      </div>
    </section>
  </div>
</template>

<style lang='scss' scoped></style>
