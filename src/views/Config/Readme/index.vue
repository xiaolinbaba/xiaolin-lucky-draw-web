<script setup lang='ts'>
import markdownit from 'markdown-it'
import { onMounted, ref } from 'vue'
import i18n from '@/locales/i18n'

const md = markdownit()
const readmeHtml = ref('')
function readMd() {
  fetch(`/${i18n.global.t('data.readmeName')}`)
    .then((res) => {
      if (!res.ok) {
        throw new Error(`Unable to load README: ${res.status}`)
      }
      return res.text()
    })
    .then((res) => {
      readmeHtml.value = md.render(res)
    })
    .catch((error) => {
      console.error('Failed to load README', error)
      readmeHtml.value = ''
    })
}

onMounted(() => {
  readMd()
})
</script>

<template>
  <div class="w-3/4 mb-10 ml-3">
    <div v-dompurify-html="readmeHtml" class="markdown-body" />
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
</style>
