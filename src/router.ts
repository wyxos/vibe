import { createRouter, createWebHashHistory } from 'vue-router'
import Backfill from './pages/examples/Backfill.vue'
import ResumeSession from './pages/examples/ResumeSession.vue'
import Search from './pages/examples/Search.vue'
import VideosOnly from './pages/examples/VideosOnly.vue'
import Home from './pages/Home.vue'

export const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: Home,
    },
    {
      path: '/examples/backfill',
      name: 'examples-backfill',
      component: Backfill,
    },
    {
      path: '/examples/resume-session',
      name: 'examples-resume-session',
      component: ResumeSession,
    },
    {
      path: '/examples/search',
      name: 'examples-search',
      component: Search,
    },
    {
      path: '/examples/videos-only',
      name: 'examples-videos-only',
      component: VideosOnly,
    },
  ],
})
