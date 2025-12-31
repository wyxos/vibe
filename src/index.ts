import type { App, Plugin } from 'vue'
import Masonry from './components/Masonry.vue'

export { Masonry }
export * from './masonry/types'

export const VibePlugin: Plugin = {
  install(app: App) {
    app.component('Masonry', Masonry)
  },
}
