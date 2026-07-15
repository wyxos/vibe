import {
  createRouter,
  createWebHistory,
  type RouterHistory,
} from 'vue-router'

import DemosPage from './pages/DemosPage.vue'
import FeedDemoPage from './pages/FeedDemoPage.vue'

export function createDemoRouter(
  history: RouterHistory = createWebHistory(import.meta.env.BASE_URL),
) {
  return createRouter({
    history,
    routes: [
      { path: '/', name: 'feed', component: FeedDemoPage },
      { path: '/demos', name: 'demos', component: DemosPage },
    ],
  })
}
