<script setup lang='ts'>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps({
  data: {
    type: Array as any,
    default: [] as any[],
  },
  tableColumns: {
    type: Array,
    default: [] as any[],
  },
})
const { t } = useI18n()
const dataColumns = computed<any[]>(() => {
  // 不带有actions的列
  const columns = props.tableColumns.filter((item: any) => !item.actions)

  return columns
})

const actionsColumns = computed<any[]>(() => {
  // 带有actions的列
  const columns = props.tableColumns.filter((item: any) => item.actions)

  return columns
})
</script>

<template>
  <div class="max-w-full overflow-x-auto">
    <table class="table min-w-[720px]">
      <thead class="bg-base-200/70 text-base-content/70">
        <tr>
          <th v-for="(item, index) in dataColumns" :key="index">
            {{ item.label }}
          </th>
          <th v-for="(item, index) in actionsColumns" :key="index">
            {{ t('table.operation') }}
          </th>
        </tr>
      </thead>
      <tbody v-if="data.length > 0">
        <tr v-for="item in data" :key="item.id" class="border-base-content/10 hover:bg-base-200/40">
          <td v-for="(column, index) in dataColumns" :key="index">
            <span v-if="column.formatValue">{{ column.formatValue(item) }}</span>
            <span v-else>{{ item[column.props] }}</span>
          </td>
          <td v-for="(column, index) in actionsColumns" :key="index">
            <div class="flex flex-wrap gap-2">
              <button
                v-for="action in column.actions" :key="action.label" class="btn btn-xs whitespace-nowrap" :class="action.type"
                @click="action.onClick(item)"
              >
                {{ action.label }}
              </button>
            </div>
          </td>
        </tr>
      </tbody>
      <tbody v-else>
        <tr>
          <td :colspan="dataColumns.length + actionsColumns.length" class="h-40 text-center text-base-content/55">
            {{ t('table.noneData') }}
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style lang='scss' scoped></style>
