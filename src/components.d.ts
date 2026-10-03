// Components registered globally in main.ts, plus Vue Router components.
export {}

declare module 'vue' {
  export interface GlobalComponents {
    RouterLink: typeof import('vue-router')['RouterLink']
    RouterView: typeof import('vue-router')['RouterView']
    SvgIcon: typeof import('./components/SvgIcon/index.vue')['default']
  }
}
