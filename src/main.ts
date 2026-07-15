import { createApp } from 'vue'

import App from './App.vue'
import { createDemoRouter } from './router'
import './style.css'

createApp(App)
  .use(createDemoRouter())
  .mount('#app')
