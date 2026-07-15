<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { configRoutesChildren } from '../../router'

const router = useRouter()
const route = useRoute()
const { t } = useI18n()

const currentYear = computed(() => new Date().getFullYear())
const menuList = computed(() => configRoutesChildren.filter(item => item.meta))
const currentMenu = computed(() => menuList.value.find(item => item.name === route.name) ?? menuList.value[0])
const currentTitle = computed(() => t(String(currentMenu.value?.meta?.titleKey ?? '')))
const currentDescription = computed(() => t(String(currentMenu.value?.meta?.descriptionKey ?? '')))

function skip(path: string) {
  void router.push(path)
}

function handleMobileNavigation(event: Event) {
  skip((event.target as HTMLSelectElement).value)
}
</script>

<template>
  <div class="config-shell flex min-h-full flex-col bg-base-200/40 text-base-content">
    <div class="flex flex-1 items-stretch">
      <aside
        class="sticky top-0 hidden h-[100dvh] w-64 shrink-0 flex-col border-r border-base-content/10 bg-base-100 md:flex"
        :aria-label="t('admin.navigation')"
      >
        <button
          class="flex h-20 appearance-none items-center gap-3 border-x-0 border-t-0 border-b border-base-content/10 bg-transparent px-6 text-left text-inherit transition-colors hover:bg-base-200/60"
          type="button"
          @click="skip('/home')"
        >
          <img src="/favicon.svg" alt="" class="h-10 w-10">
          <span class="min-w-0">
            <strong class="block truncate text-lg leading-tight">Luck</strong>
            <span class="block truncate text-xs text-base-content/60">{{ t('admin.backHome') }}</span>
          </span>
        </button>

        <nav class="flex-1 overflow-y-auto p-4">
          <p class="mb-2 px-3 text-xs font-semibold text-base-content/50">
            {{ t('admin.navigation') }}
          </p>
          <ul class="menu w-full gap-1 p-0">
            <li v-for="item in menuList" :key="item.name">
              <button
                type="button"
                class="min-h-11 w-full appearance-none gap-3 rounded-lg border-0 bg-transparent text-inherit"
                :class="item.name === route.name ? 'active font-semibold' : ''"
                :aria-current="item.name === route.name ? 'page' : undefined"
                @click="skip(item.path)"
              >
                <svg-icon v-if="item.meta?.icon" :name="item.meta.icon" class="h-4 w-4 shrink-0" />
                <span class="truncate">{{ t(String(item.meta!.titleKey)) }}</span>
              </button>
            </li>
          </ul>
        </nav>
      </aside>

      <div class="flex min-w-0 flex-1 flex-col">
        <header class="border-b border-base-content/10 bg-base-100/80 px-4 py-5 sm:px-6 lg:px-10">
          <div class="mx-auto w-full max-w-[1440px]">
            <label class="mb-4 block md:hidden">
              <span class="mb-2 block text-xs font-semibold text-base-content/60">{{ t('admin.navigation') }}</span>
              <select class="select select-bordered w-full" :value="route.path" @change="handleMobileNavigation">
                <option v-for="item in menuList" :key="item.name" :value="item.path">
                  {{ t(String(item.meta!.titleKey)) }}
                </option>
              </select>
            </label>
            <h1 class="m-0 text-2xl font-bold tracking-tight sm:text-3xl">
              {{ currentTitle }}
            </h1>
            <p class="mb-0 mt-2 max-w-2xl text-sm leading-6 text-base-content/65 sm:text-base">
              {{ currentDescription }}
            </p>
          </div>
        </header>

        <main class="flex-1 px-4 pt-5 pb-24 sm:px-6 sm:pt-7 md:pb-7 lg:px-10 lg:pt-8 lg:pb-8">
          <div class="mx-auto w-full max-w-[1440px] rounded-2xl border border-base-content/10 bg-base-100 p-4 shadow-sm sm:p-6 lg:p-8">
            <router-view />
          </div>
        </main>

        <footer class="mt-auto border-t border-base-content/10 bg-base-100 px-4 py-5 text-center text-sm text-base-content/60">
          <p class="m-0">
            &copy; {{ currentYear }} XIAOLIN AI LAB.
            <a href="mailto:ceo@thus.chat" class="link-hover ml-1 font-medium text-base-content">EMAIL</a>
          </p>
        </footer>
      </div>
    </div>
  </div>
</template>
