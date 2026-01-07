import type { App, Plugin } from 'vue'
import Masonry from './components/Masonry.vue'
import MasonryItem from './components/MasonryItem.vue'
import MasonryVideoControls from './components/MasonryVideoControls.vue'

export { Masonry, MasonryItem, MasonryVideoControls }
export * from './masonry/types'

export const VibePlugin: Plugin = {
  install(app: App) {
    app.component('Masonry', Masonry)
    app.component('MasonryItem', MasonryItem)
    app.component('MasonryVideoControls', MasonryVideoControls)
  },
}
