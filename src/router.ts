import { createRouter, createWebHistory } from 'vue-router'

import DocumentationPage from '@/pages/DocumentationPage.vue'
import FeedBehaviorDemoPage from '@/pages/FeedBehaviorDemoPage.vue'
import FakeServerDebugPage from '@/pages/FakeServerDebugPage.vue'
import HomePage from '@/pages/HomePage.vue'
import RefreshAppendDebugPage from '@/pages/RefreshAppendDebugPage.vue'
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
          path: 'demo/feed-behavior',
          name: 'demo-feed-behavior',
          component: FeedBehaviorDemoPage,
        },
        {
          path: 'documentation',
          name: 'documentation',
          component: DocumentationPage,
        },
        {
          path: 'debug/fake-server',
          name: 'debug-fake-server',
          component: FakeServerDebugPage,
        },
        {
          path: 'debug/refresh-append',
          name: 'debug-refresh-append',
          component: RefreshAppendDebugPage,
        },
      ],
    },
  ],
})

export default router
