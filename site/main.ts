import { createApp } from 'vue'
import App from './App.vue'
import './site.css'

if (import.meta.env.DEV && new URLSearchParams(window.location.search).get('compare') === '1') {
  void import('./Comparison.vue').then(({ default: Comparison }) => createApp(Comparison).mount('#app'))
} else createApp(App).mount('#app')
