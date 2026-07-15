<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const isConfigRoute = computed(() => route.path.startsWith('/config'))
</script>

<template>
  <div class="min-h-[100dvh] w-screen">
    <!-- <header class="shadow-2xl head-container h-14">
      <Header></Header>
    </header> -->
    <main
      :data-theme="isConfigRoute ? 'light' : undefined"
      class="box-border h-[100dvh] w-screen overflow-x-hidden overflow-y-auto main-container"
      :class="{ 'config-scroll-container': isConfigRoute }"
    >
      <router-view class="min-h-full main-container-content" />
    </main>
    <!-- <footer class="w-screen footer-container">
      <Footer></Footer>
    </footer> -->
  </div>
</template>

<style scoped lang="scss">

</style>
