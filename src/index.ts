import type { App, Plugin } from 'vue'

import VibeRoot from './components/VibeRoot.vue'

export { VibeRoot }

export const VibePlugin: Plugin = {
  install(app: App) {
    app.component('VibeRoot', VibeRoot)
  },
}

export default VibeRoot
