import { createRouter, createWebHashHistory } from 'vue-router'

import Home from './pages/Home.vue'

export const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: Home,
    },
  ],
})
