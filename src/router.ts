import {
  createRouter,
  createWebHistory,
  type RouterHistory,
} from 'vue-router'

import DemosPage from './pages/DemosPage.vue'
import AutoScrollDemoPage from './pages/AutoScrollDemoPage.vue'
import AutofillBackendDemoPage from './pages/AutofillBackendDemoPage.vue'
import AutofillBackendRefreshDemoPage from './pages/AutofillBackendRefreshDemoPage.vue'
import AutofillFrontendDemoPage from './pages/AutofillFrontendDemoPage.vue'
import CardHeaderFooterDemoPage from './pages/CardHeaderFooterDemoPage.vue'
import FeedDemoPage from './pages/FeedDemoPage.vue'
import FillBackendDemoPage from './pages/FillBackendDemoPage.vue'
import FillFrontendDemoPage from './pages/FillFrontendDemoPage.vue'
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
          {
            path: 'auto-scroll',
            name: 'demo-auto-scroll',
            component: AutoScrollDemoPage,
          },
          {
            path: 'autofill/frontend',
            name: 'demo-autofill-frontend',
            component: AutofillFrontendDemoPage,
          },
          {
            path: 'autofill/backend',
            name: 'demo-autofill-backend',
            component: AutofillBackendDemoPage,
          },
          {
            path: 'autofill/backend-refresh',
            name: 'demo-autofill-backend-refresh',
            component: AutofillBackendRefreshDemoPage,
          },
          {
            path: 'fill/frontend',
            name: 'demo-fill-frontend',
            component: FillFrontendDemoPage,
          },
          {
            path: 'fill/backend',
            name: 'demo-fill-backend',
            component: FillBackendDemoPage,
          },
        ],
      },
    ],
  })
}
