import type { App, Plugin } from 'vue'
import Masonry from './src/Masonry.vue'
import MasonryItem from './src/components/MasonryItem.vue'

const plugin: Plugin = {
  install(app: App) {
    app.component('WyxosMasonry', Masonry)
    app.component('WMasonry', Masonry)
    app.component('WyxosMasonryItem', MasonryItem)
    app.component('WMasonryItem', MasonryItem)
  }
}

export default plugin
export { Masonry, MasonryItem }
