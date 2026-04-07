import type { App, Plugin } from 'vue'

import VibeInstance from './components/Vibe.vue'
export type { VibeViewerAsset, VibeViewerItem, VibeViewerType } from './components/viewer'
export type {
  VibeGetItemsParams,
  VibeGetItemsResult,
  VibeAutoProps,
  VibeControlledProps,
  VibeHandle,
  VibeProps,
} from './components/viewer-core/useViewer'

export const Vibe = VibeInstance
export { VibeInstance }

export const VibePlugin: Plugin = {
  install(app: App) {
    app.component('Vibe', Vibe)
  },
}

export default Vibe
