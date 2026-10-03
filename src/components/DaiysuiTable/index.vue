<script setup lang='ts'>
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps({
  data: {
    type: Array as any,
    default: () => [] as any[],
  },
  tableColumns: {
    type: Array,
    default: () => [] as any[],
  },
})
const { t } = useI18n()
const page = ref(1)
const pageSize = ref(50)
const pageCount = computed(() => Math.max(1, Math.ceil(props.data.length / pageSize.value)))
const visibleRows = computed(() => props.data.slice((page.value - 1) * pageSize.value, page.value * pageSize.value))
watch(pageCount, count => page.value = Math.min(page.value, count))
watch(pageSize, () => page.value = 1)
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
          <th v-for="(_, index) in actionsColumns" :key="index">
            {{ t('table.operation') }}
          </th>
        </tr>
      </thead>
      <tbody v-if="data.length > 0">
        <tr v-for="item in visibleRows" :key="item.id" class="border-base-content/10 hover:bg-base-200/40">
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
    <nav v-if="data.length" class="flex flex-wrap items-center justify-end gap-3 border-t border-base-content/10 p-3" :aria-label="t('admin.pagination')">
      <label class="flex items-center gap-2 text-sm">
        {{ t('admin.pageSize') }}
        <select v-model="pageSize" class="select select-bordered select-sm">
          <option v-for="size in [25, 50, 100]" :key="size" :value="size">{{ size }}</option>
        </select>
      </label>
      <span class="text-sm tabular-nums">{{ t('admin.pageInfo', { page, pages: pageCount, count: data.length }) }}</span>
      <button class="btn btn-sm" :disabled="page === 1" @click="page--">
        {{ t('admin.previous') }}
      </button>
      <button class="btn btn-sm" :disabled="page === pageCount" @click="page++">
        {{ t('admin.next') }}
      </button>
    </nav>
  </div>
</template>

<style lang='scss' scoped></style>
