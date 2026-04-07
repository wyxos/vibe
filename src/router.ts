import { createRouter, createWebHistory } from 'vue-router'

import BidirectionalPagingDemoPage from '@/pages/BidirectionalPagingDemoPage.vue'
import DocumentationPage from '@/pages/DocumentationPage.vue'
import FakeServerDebugPage from '@/pages/FakeServerDebugPage.vue'
import HomePage from '@/pages/HomePage.vue'
import WorkspaceLayout from '@/pages/WorkspaceLayout.vue'

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      component: WorkspaceLayout,
      meta: {
        immersive: true,
      },
      children: [
        {
          path: '',
          name: 'home',
          component: HomePage,
        },
        {
          path: 'documentation',
          name: 'documentation',
          component: DocumentationPage,
        },
        {
          path: 'demo/advanced-integration',
          name: 'demo-advanced-integration',
          component: BidirectionalPagingDemoPage,
        },
        {
          path: 'debug/fake-server',
          name: 'debug-fake-server',
          component: FakeServerDebugPage,
        },
      ],
    },
  ],
})

export default router
