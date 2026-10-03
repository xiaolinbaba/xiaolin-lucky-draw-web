<script setup lang='ts'>
import daisyuiThemes from 'daisyui/src/theming/themes'

import { storeToRefs } from 'pinia'
import { ref, watch } from 'vue'
import { ColorPicker } from 'vue3-colorpicker'
import { useI18n } from 'vue-i18n'
import ConfirmDialog from '@/components/ConfirmDialog/index.vue'
import DataBackup from '@/components/DataBackup/index.vue'
import { languageList } from '@/locales/i18n'
import useStore from '@/store'
import { createDefaultGlobalConfig } from '@/store/globalConfig'
import { createDefaultPrizeConfig } from '@/store/prizeConfig'
import { themeChange } from '@/utils'
import { createBackup, downloadBlob, restoreBackup, validateBackup } from '@/utils/backup'
import { isHex, isRgbOrRgba } from '@/utils/color'
import { isIntegerInRange, numericLimits } from '@/utils/validation'
import PatternSetting from './components/PatternSetting.vue'
import 'vue3-colorpicker/style.css'

const { t } = useI18n()
const globalConfig = useStore().globalConfig
const personConfig = useStore().personConfig
const prizeConfig = useStore().prizeConfig
const { getTopTitle: topTitle, getTheme: localTheme, getPatterColor: patternColor, getPatternList: patternList, getCardColor: cardColor, getLuckyColor: luckyCardColor, getTextColor: textColor, getCardSize: cardSize, getTextSize: textSize, getRowCount: rowCount, getIsShowPrizeList: isShowPrizeList, getLanguage: userLanguage, getBackground: backgroundImage, getImageList: imageList,
} = storeToRefs(globalConfig)
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
  cardWidth: '',
  cardHeight: '',
  textSize: '',
})
function validateNumber(field: keyof typeof formErr.value, value: unknown) {
  const [min, max] = numericLimits[field]
  formErr.value[field] = isIntegerInRange(value, min, max) ? '' : t('error.integerRange', { min, max })
  return !formErr.value[field]
}

function resetPersonLayout() {
  isRowCountChange.value = 2
  setTimeout(() => {
    personConfig.updatePersonLayout(rowCount.value)
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
  const previous = await createBackup({ globalConfig: globalConfig.globalConfig }, { personConfig: personConfig.personConfig }, { prizeConfig: prizeConfig.prizeConfig })
  downloadBlob(previous, `luck-before-reset-${Date.now()}.json`)
  await restoreBackup(validateBackup({ format: 'luck-backup', version: 1, createdAt: new Date().toISOString(), global: createDefaultGlobalConfig(), people: { personConfig: { allPersonList: [], alreadyPersonList: [] } }, prizes: { prizeConfig: createDefaultPrizeConfig() }, images: [], audio: [] }))
  window.location.reload()
}

// const handleChangeShowFields = (fieldItem: any) => {
//     formData.value.showField.map((item) => {
//         if (item.label === fieldItem.label) {
//             item.value = !item.value
//         }
//     })
// }

watch(() => formData.value.rowCount, (value) => {
  if (validateNumber('rowCount', value)) {
    isRowCountChange.value = 1
    globalConfig.setRowCount(value)
  }
  else {
    isRowCountChange.value = 0
  }
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
  const widthValid = validateNumber('cardWidth', val.width)
  const heightValid = validateNumber('cardHeight', val.height)
  if (widthValid && heightValid)
    globalConfig.setCardSize({ ...val })
}, { deep: true })
watch(textSizeValue, (val) => {
  if (validateNumber('textSize', val))
    globalConfig.setTextSize(val)
})

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
    <ConfirmDialog ref="resetDataDialogRef" />

    <section class="config-section">
      <header class="config-section-header">
        <h2 class="config-section-title">
          {{ t('admin.section.basicSettings') }}
        </h2>
        <button class="btn btn-error btn-outline btn-sm" @click="resetDataDialogRef.open(t('dialog.dialogResetAllData'), resetData)">
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
            <input v-model="formData.rowCount" type="number" min="1" max="100" step="1" :aria-invalid="!!formErr.rowCount" class="input input-bordered min-w-0 flex-1">
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
          <input v-model="cardSizeValue.width" type="number" min="20" max="1000" step="1" :aria-invalid="!!formErr.cardWidth" class="input input-bordered w-full">
          <span v-if="formErr.cardWidth" role="alert" class="text-sm text-error">{{ formErr.cardWidth }}</span>
        </label>
        <label class="config-field">
          <span class="label"><span class="label-text">{{ t('table.cardHeight') }}</span></span>
          <input v-model="cardSizeValue.height" type="number" min="20" max="1000" step="1" :aria-invalid="!!formErr.cardHeight" class="input input-bordered w-full">
          <span v-if="formErr.cardHeight" role="alert" class="text-sm text-error">{{ formErr.cardHeight }}</span>
        </label>
        <label class="config-field">
          <span class="label"><span class="label-text">{{ t('table.textSize') }}</span></span>
          <input v-model="textSizeValue" type="number" min="8" max="200" step="1" :aria-invalid="!!formErr.textSize" class="input input-bordered w-full">
          <span v-if="formErr.textSize" role="alert" class="text-sm text-error">{{ formErr.textSize }}</span>
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
    <DataBackup />
  </div>
</template>

<style lang='scss' scoped></style>
