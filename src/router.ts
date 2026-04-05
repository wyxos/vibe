import { createRouter, createWebHistory } from 'vue-router'

import FakeServerDebugPage from '@/pages/FakeServerDebugPage.vue'
import HomePage from '@/pages/HomePage.vue'

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomePage,
      meta: {
        immersive: true,
      },
    },
    {
      path: '/debug/fake-server',
      name: 'debug-fake-server',
      component: FakeServerDebugPage,
    },
  ],
})

export default router
