import type { App, Plugin } from 'vue'

import Layout from './components/Layout.vue'
export type { VibeViewerAsset, VibeViewerItem, VibeViewerType } from './components/viewer'
export type {
  VibeResolveParams,
  VibeResolveResult,
  VibeAutoProps,
  VibeControlledProps,
  VibeHandle,
  VibeProps,
} from './components/viewer-core/useViewer'

export const VibeLayout = Layout

export const VibePlugin: Plugin = {
  install(app: App) {
    app.component('VibeLayout', VibeLayout)
  },
}

export default VibePlugin
