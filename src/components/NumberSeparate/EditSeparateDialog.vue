<script setup lang='ts'>
import type { Separate } from '@/types/storeType'
import { onMounted, onUnmounted, ref, toRefs, watch } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps({
  totalNumber: {
    type: Number,
    default: 0,
  },
  separatedNumber: {
    type: Array<Separate>,
    default: () => [],
  },
})
const emits = defineEmits(['submitData'])
const { t } = useI18n()
const separatedNumberRef = ref()
const { totalNumber } = toRefs(props)
const scaleList = ref<number[]>([])
const boundaryInput = ref(1)
function editScale(item: number) {
  if (!Number.isSafeInteger(item) || item <= 0 || item >= totalNumber.value) {
    return
  }
  if (scaleList.value.includes(item)) {
    const index = scaleList.value.indexOf(item)
    scaleList.value.splice(index, 1)
  }
  else {
    scaleList.value.push(item)
    scaleList.value.sort((a, b) => a - b)
  }
}
function clearData() {
  const batches = scaleList.value.slice(1).map((boundary, index) => ({
    id: (index + 1).toString(),
    count: boundary - scaleList.value[index],
    isUsedCount: 0,
  }))
  emits('submitData', batches)
  separatedNumberRef.value.close()
}

watch(totalNumber, (val) => {
  if (val <= 0) {
    return
  }
  separatedNumberRef.value.showModal()
  // scaleList.value = [0, val]
  scaleList.value = Array.from({ length: props.separatedNumber.length + 1 }).fill(totalNumber.value) as number[]
  for (let i = props.separatedNumber.length - 1; i >= 0; i--) {
    scaleList.value[i] = scaleList.value[i + 1] - props.separatedNumber[i].count
  }
  if (scaleList.value[0] !== 0) {
    scaleList.value.unshift(0)
  }
})
function preventEscape(e: KeyboardEvent) {
  if (e.key === 'Escape' && separatedNumberRef.value?.open) {
    e.preventDefault()
  }
}

onMounted(() => document.addEventListener('keydown', preventEscape))
onUnmounted(() => document.removeEventListener('keydown', preventEscape))
</script>

<template>
  <dialog id="my_modal_1" ref="separatedNumberRef" class="z-50 overflow-hidden border-none modal">
    <div class="overflow-hidden modal-box">
      <h3 class="pb-6 text-lg font-bold">
        {{ t('dialog.titleTip') }}
      </h3>
      <p class="pb-8">
        {{ t('dialog.dialogSingleDrawLimit') }}
      </p>
      <div v-if="props.totalNumber <= 100" class="flex justify-between px-3 text-center separated-number">
        <div
          v-for="item in props.totalNumber" :key="item"
          class="relative flex flex-col items-center cursor-pointer"
        >
          <div
            class="absolute mb-12 text-center tooltip -top-5 hover:text-lg" :data-tip="t('tooltip.leftClick')"
            @click.left="editScale(item)"
          >
            <span> {{ item }}</span>
          </div>
          <div class="text-center" :class="scaleList.includes(item) ? 'text-red-500 font-extrabold' : ''">
            |
          </div>
        </div>
      </div>
      <div v-else class="space-y-3">
        <label class="flex items-center gap-2">
          <span>{{ t('admin.batchBoundary') }}</span>
          <input v-model="boundaryInput" type="number" min="1" :max="props.totalNumber - 1" step="1" class="input input-bordered input-sm w-28">
          <button type="button" class="btn btn-sm" :disabled="!Number.isSafeInteger(boundaryInput) || boundaryInput < 1 || boundaryInput >= props.totalNumber" @click="editScale(boundaryInput)">{{ t('admin.toggleBoundary') }}</button>
        </label>
        <p class="text-sm">
          {{ t('admin.batchSummary', { count: scaleList.length - 1, total: props.totalNumber }) }}
        </p>
        <p class="break-words text-sm">
          {{ scaleList.slice(1, 101).map((end, index) => end - scaleList[index]).join(' + ') }}{{ scaleList.length > 101 ? ' …' : '' }}
        </p>
      </div>
      <div class="modal-action">
        <form method="dialog">
          <!-- if there is a button in form, it will close the modal -->
          <button type="button" class="btn" @click="clearData">
            {{ t('button.close') }}
          </button>
        </form>
      </div>
    </div>
  </dialog>
</template>

<style lang='scss' scoped></style>
