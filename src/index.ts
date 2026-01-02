import type { App, Plugin } from 'vue'
import Masonry from './components/Masonry.vue'
import MasonryItem from './components/MasonryItem.vue'

export { Masonry, MasonryItem }
export * from './masonry/types'

export const VibePlugin: Plugin = {
  install(app: App) {
    app.component('Masonry', Masonry)
    app.component('MasonryItem', MasonryItem)
  },
}
