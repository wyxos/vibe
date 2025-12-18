import { createRouter, createWebHashHistory } from 'vue-router'

const router = createRouter({
  history: createWebHashHistory(), // Hash mode works perfectly with GitHub Pages
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('../views/Home.vue')
    },
    {
      path: '/examples',
      name: 'examples',
      component: () => import('../views/Examples.vue')
    }
  ]
})

export default router

