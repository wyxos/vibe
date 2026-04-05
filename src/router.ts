import { createRouter, createWebHistory } from 'vue-router'

import BidirectionalPagingDemoPage from '@/pages/BidirectionalPagingDemoPage.vue'
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
    {
      path: '/demo/bidirectional-paging',
      name: 'demo-bidirectional-paging',
      component: BidirectionalPagingDemoPage,
      meta: {
        immersive: true,
      },
    },
  ],
})

export default router
