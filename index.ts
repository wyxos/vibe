import type { App, Plugin } from 'vue'
import Masonry from './src/Masonry.vue'

const plugin: Plugin = {
  install(app: App) {
    app.component('WyxosMasonry', Masonry)
    app.component('WMasonry', Masonry)
  }
}

export default plugin
export { Masonry }
