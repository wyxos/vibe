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

const ERROR_LABELS: Readonly<Record<string, string>> = {
  401: 'Authentication required',
  403: 'Access forbidden',
  404: 'Preview not found',
  419: 'Session expired',
  500: 'Server error',
}

export function mediaErrorStatus(src: string): string {
  return src.match(/\/demo-errors\/(401|403|404|419|500)\//)?.[1] ?? 'Error'
}

export function mediaErrorLabel(src: string): string {
  return ERROR_LABELS[mediaErrorStatus(src)] ?? 'Preview unavailable'
}
