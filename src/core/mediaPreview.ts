import type { Component } from 'vue'

export type MediaPreviewState = 'loading' | 'ready' | 'error'

export interface VibeMediaError {
  component: Component
}

export interface VibeMediaErrorProps {
  label: string
  retry: () => void
  retrying: boolean
  status: string
}

export function mediaErrorStatus(_src: string): string {
  // Native media errors do not expose an HTTP status. The host can supply
  // richer diagnostics through its custom error component.
  return 'Error'
}

export function mediaErrorLabel(_src: string): string {
  return 'Preview unavailable'
}
