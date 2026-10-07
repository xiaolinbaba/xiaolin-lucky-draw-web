<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import donationQr from '@/assets/images/wechat-donation.png'

const { t } = useI18n()
</script>

<template>
  <div class="config-page">
    <div class="grid min-w-0 grid-cols-1 gap-4">
      <section class="config-section">
        <header class="config-section-header">
          <h2 class="config-section-title">
            {{ t('support.githubTitle') }}
          </h2>
        </header>
        <div class="config-section-body space-y-4">
          <p class="m-0 text-sm leading-7 text-base-content/75">
            {{ t('support.githubDescription') }}
          </p>
          <a
            href="https://github.com/xiaolinbaba/xiaolin-lucky-draw-web"
            target="_blank" rel="noopener noreferrer"
            class="btn btn-primary btn-sm h-auto min-h-10 max-w-full whitespace-normal py-2 text-center"
          >
            {{ t('support.githubButton') }}
          </a>
        </div>
      </section>

      <section class="config-section">
        <header class="config-section-header">
          <h2 class="config-section-title">
            {{ t('support.donationTitle') }}
          </h2>
        </header>
        <div class="config-section-body space-y-4">
          <p class="m-0 text-sm leading-7 text-base-content/75">
            {{ t('support.donationDescription') }}
          </p>
          <img
            :src="donationQr" :alt="t('support.qrAlt')"
            width="828" height="1124"
            class="block h-auto w-full max-w-[280px] rounded-lg"
          >
          <p class="m-0 text-xs leading-6 text-base-content/60">
            {{ t('support.scanHint') }}
          </p>
          <p class="m-0 text-sm text-base-content/75">
            {{ t('support.thanks') }}
          </p>
        </div>
      </section>
    </div>
  </div>
</template>
