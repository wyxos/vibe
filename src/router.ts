import {
  createRouter,
  createWebHistory,
  type RouterHistory,
} from 'vue-router'

import DemosPage from './pages/DemosPage.vue'
import CardHeaderFooterDemoPage from './pages/CardHeaderFooterDemoPage.vue'
import FeedDemoPage from './pages/FeedDemoPage.vue'
import ReelUrlDemoPage from './pages/ReelUrlDemoPage.vue'

const EmptyRouteView = { render: () => null }

export function createDemoRouter(
  history: RouterHistory = createWebHistory(import.meta.env.BASE_URL),
) {
  return createRouter({
    history,
    routes: [
      { path: '/', name: 'feed', component: FeedDemoPage },
      {
        path: '/demos',
        component: DemosPage,
        redirect: { name: 'demo-card-header-footer' },
        children: [
          {
            path: 'card-header-and-footer',
            name: 'demo-card-header-footer',
            component: CardHeaderFooterDemoPage,
          },
          {
            path: 'reel-url',
            name: 'demo-reel-url',
            component: ReelUrlDemoPage,
            children: [
              {
                path: 'file/:fileId',
                name: 'demo-reel-url-file',
                component: EmptyRouteView,
              },
            ],
          },
        ],
      },
    ],
  })
}
