import type { App, Plugin } from 'vue'
import Masonry from './Masonry.vue'

export { Masonry }
export * from './masonryTypes'

export const VibePlugin: Plugin = {
  install(app: App) {
    app.component('Masonry', Masonry)
  },
}
