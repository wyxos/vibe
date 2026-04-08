import { createRouter, createWebHistory } from 'vue-router'

import BidirectionalPagingDemoPage from '@/pages/BidirectionalPagingDemoPage.vue'
import DocumentationPage from '@/pages/DocumentationPage.vue'
import FakeServerDebugPage from '@/pages/FakeServerDebugPage.vue'
import DynamicFeedDemoPage from '@/pages/DynamicFeedDemoPage.vue'
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
          path: 'demo/dynamic-feed',
          name: 'demo-dynamic-feed',
          component: DynamicFeedDemoPage,
        },
        {
          path: 'documentation',
          name: 'documentation',
          component: DocumentationPage,
        },
        {
          path: 'demo/advanced-integration',
          name: 'demo-advanced-static',
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
