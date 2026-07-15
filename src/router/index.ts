import { createRouter, createWebHashHistory, createWebHistory } from 'vue-router'
import Layout from '@/layout/index.vue'
import Home from '@/views/Home/index.vue'

const envMode = import.meta.env.MODE

// 导出配置路由的 children，供 Config/index.vue 使用
// 所有配置项直接显示，无分组，按指定顺序排列
export const configRoutesChildren = [
  {
    path: '',
    redirect: '/config/global/face',
  },
  // 1. 界面设置
  {
    path: '/config/global/face',
    name: 'FaceConfig',
    component: () => import('@/views/Config/Global/FaceConfig.vue'),
    meta: {
      titleKey: 'sidebar.viewSetting',
      descriptionKey: 'admin.description.viewSetting',
      icon: 'setting',
    },
  },
  // 2. 人员列表
  {
    path: '/config/person/all',
    name: 'AllPersonConfig',
    component: () => import('@/views/Config/Person/PersonAll.vue'),
    meta: {
      titleKey: 'sidebar.personList',
      descriptionKey: 'admin.description.personList',
      icon: 'edit',
    },
  },
  // 3. 中奖人员
  {
    path: '/config/person/already',
    name: 'AlreadyPerson',
    component: () => import('@/views/Config/Person/PersonAlready.vue'),
    meta: {
      titleKey: 'sidebar.winnerList',
      descriptionKey: 'admin.description.winnerList',
      icon: 'home',
    },
  },
  // 4. 奖品配置
  {
    path: '/config/prize',
    name: 'PrizeConfig',
    component: () => import('@/views/Config/Prize/PrizeConfig.vue'),
    meta: {
      titleKey: 'sidebar.prizeConfiguration',
      descriptionKey: 'admin.description.prizeConfiguration',
      icon: 'add',
    },
  },
  // 5. 图片管理
  {
    path: '/config/global/image',
    name: 'ImageConfig',
    component: () => import('@/views/Config/Global/ImageConfig.vue'),
    meta: {
      titleKey: 'sidebar.imagesManagement',
      descriptionKey: 'admin.description.imagesManagement',
      icon: 'open',
    },
  },
  // 6. 音乐管理
  {
    path: '/config/global/music',
    name: 'MusicConfig',
    component: () => import('@/views/Config/Global/MusicConfig.vue'),
    meta: {
      titleKey: 'sidebar.musicManagement',
      descriptionKey: 'admin.description.musicManagement',
      icon: 'play',
    },
  },
  // 7. 操作说明
  {
    path: '/config/readme',
    name: 'Readme',
    component: () => import('@/views/Config/Readme/index.vue'),
    meta: {
      titleKey: 'sidebar.operatingInstructions',
      descriptionKey: 'admin.description.operatingInstructions',
      icon: 'menu',
    },
  },
]

// 使用根路径路由配置（适用于 file 模式和 Cloudflare Pages 部署）
const rootRoutes = [
  {
    path: '/',
    component: Layout,
    redirect: '/home',
    children: [
      {
        path: '/home',
        name: 'Home',
        component: Home,
      },
      {
        path: '/demo',
        name: 'Demo',
        component: () => import('@/views/Demo/index.vue'),
      },
      {
        path: '/config',
        component: () => import('@/views/Config/index.vue'),
        children: configRoutesChildren,
      },
    ],
  },
]
// 在 file 模式下使用 hash 路由，其他模式使用 history 路由
const finalRoutes = rootRoutes

const router = createRouter({
  // 读取环境变量：file 模式使用 hash 路由，其他模式使用 history 路由
  history: envMode === 'file' ? createWebHashHistory() : createWebHistory(),
  routes: finalRoutes,
})

export default router
