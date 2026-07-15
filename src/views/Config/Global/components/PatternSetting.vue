<script setup lang='ts'>
import { computed } from 'vue'

const props = defineProps({
  rowCount: {
    type: Number,
    default: 17,
  },
  cardColor: {
    type: String,
    default: '#fff',
  },
  patternColor: {
    type: String,
    default: '#000',
  },
  patternList: {
    type: Array,
    default: () => [],
  },
})
const emit = defineEmits<{
  'update:patternList': [value: number[]]
}>()
const data = computed(() => {
  return props
})

function updatePatternList(event: Event, item: number) {
  const nextPatternList = [...data.value.patternList] as number[]
  if (nextPatternList.includes(item)) {
    const index = nextPatternList.indexOf(item)
    nextPatternList.splice(index, 1)
  }
  else {
    nextPatternList.push(item)
  }
  emit('update:patternList', nextPatternList)
}
</script>

<template>
  <div class="w-full h-auto">
    <ul class="pattern-list" :style="{ gridTemplateColumns: `repeat(${data.rowCount},1fr)` }">
      <li v-for="item in data.rowCount * 7" :key="item" class="w-5 h-5" :style="{ backgroundColor: data.patternList.includes(item) ? data.patternColor : data.cardColor }" @click.stop="(event) => updatePatternList(event, item)" />
    </ul>
  </div>
</template>

<style lang='scss' scoped>
    .pattern-list{
        margin: 0;
        padding: 0;
        display:grid;
        grid-template-rows:repeat(7,1fr);
        grid-gap:1px;
        border:1px solid #000;
        li{
            cursor:pointer;
        }
    }
</style>
