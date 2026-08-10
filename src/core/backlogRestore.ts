import type { CreateVibeOptions, VibePage } from '../types'

export async function restoreBacklog(
  restore: CreateVibeOptions['restoreBacklog'],
  appendPage: (page: VibePage) => void,
  setController: (controller: AbortController | null) => void,
): Promise<void> {
  if (!restore) return
  const controller = new AbortController()
  setController(controller)
  try {
    await restore({ appendPage, signal: controller.signal })
  } finally {
    setController(null)
  }
}
