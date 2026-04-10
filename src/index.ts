import type { App, Plugin } from 'vue'

import './style.css'
import Layout from './components/Layout.vue'
export type { VibeViewerAsset, VibeViewerItem, VibeViewerType } from './components/viewer'
export type {
  VibeAssetErrorEvent,
  VibeAssetErrorKind,
  VibeAssetErrorSurface,
  VibeAssetLoadQueueLimits,
  VibeAssetLoadEvent,
  VibeAssetLoadSurface,
  VibeResolveParams,
  VibeResolveResult,
  VibeAutoProps,
  VibeControlledProps,
  VibeFeedMode,
  VibeHandle,
  VibeInitialState,
  VibeLoadPhase,
  VibeProps,
  VibeSurfaceMode,
  VibeStatus,
} from './components/viewer-core/useViewer'

export const VibeLayout = Layout

export const VibePlugin: Plugin = {
  install(app: App) {
    app.component('VibeLayout', VibeLayout)
  },
}

export default VibePlugin
