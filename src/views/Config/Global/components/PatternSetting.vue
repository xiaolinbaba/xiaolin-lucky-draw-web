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

function updatePatternList(item: number) {
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
      <li v-for="item in data.rowCount * 7" :key="item" class="h-5 w-5">
        <button
          type="button" class="block h-full w-full rounded-sm transition-transform active:scale-90"
          :style="{ backgroundColor: data.patternList.includes(item) ? data.patternColor : data.cardColor }"
          :aria-pressed="data.patternList.includes(item)" @click.stop="updatePatternList(item)"
        />
      </li>
    </ul>
  </div>
</template>

<style lang='scss' scoped>
    .pattern-list{
        margin: 0;
        padding: 0;
        display:grid;
        grid-template-rows:repeat(7,1fr);
        gap:2px;
        width:max-content;
        min-width:100%;
        border:1px solid hsl(var(--bc) / 0.14);
        border-radius:0.5rem;
        background:hsl(var(--b2));
        padding:0.5rem;
    }
</style>
