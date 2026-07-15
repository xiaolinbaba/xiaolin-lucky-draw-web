<script setup lang='ts'>
import markdownit from 'markdown-it'
import { onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import i18n from '@/locales/i18n'

const md = markdownit()
const { t } = useI18n()
const readmeHtml = ref('')
const isLoading = ref(true)
const readmeError = ref('')

async function readMd() {
  try {
    const response = await fetch(`/${i18n.global.t('data.readmeName')}`)
    if (!response.ok) {
      throw new Error(`Unable to load README: ${response.status}`)
    }
    readmeHtml.value = md.render(await response.text())
  }
  catch (error) {
    console.error('Failed to load README', error)
    readmeError.value = t('error.readmeLoadFailed')
  }
  finally {
    isLoading.value = false
  }
}

onMounted(() => {
  readMd()
})
</script>

<template>
  <div class="config-page">
    <section class="config-section">
      <div v-if="isLoading" class="config-section-body space-y-4" aria-busy="true">
        <div class="skeleton h-8 w-2/5" />
        <div class="skeleton h-4 w-full" />
        <div class="skeleton h-4 w-5/6" />
        <div class="skeleton h-40 w-full" />
      </div>
      <div v-else-if="readmeError" role="alert" class="config-empty text-error">
        {{ readmeError }}
      </div>
      <div v-else class="config-section-body">
        <div v-dompurify-html="readmeHtml" class="admin-readme markdown-body mx-auto max-w-4xl" />
      </div>
    </section>
  </div>
</template>

<style>
/* 确保在 dracula 主题下文字颜色正确 */
html[data-theme="dracula"] .markdown-body {
  color: #e6edf3 !important;
}

html[data-theme="dracula"] .markdown-body p,
html[data-theme="dracula"] .markdown-body li,
html[data-theme="dracula"] .markdown-body td,
html[data-theme="dracula"] .markdown-body th,
html[data-theme="dracula"] .markdown-body div,
html[data-theme="dracula"] .markdown-body span {
  color: #e6edf3 !important;
}

html[data-theme="dracula"] .markdown-body h1,
html[data-theme="dracula"] .markdown-body h2,
html[data-theme="dracula"] .markdown-body h3,
html[data-theme="dracula"] .markdown-body h4,
html[data-theme="dracula"] .markdown-body h5,
html[data-theme="dracula"] .markdown-body h6 {
  color: #e6edf3 !important;
}

html[data-theme="dracula"] .markdown-body a {
  color: #2f81f7 !important;
}

html[data-theme="dracula"] .markdown-body code {
  color: #e6edf3 !important;
  background-color: rgba(110, 118, 129, 0.4) !important;
}

.admin-readme.markdown-body {
  width: 100%;
  color: inherit;
  background: transparent;
}
</style>
