import { beforeEach, vi } from 'vitest'

HTMLMediaElement.prototype.play = vi.fn().mockResolvedValue(undefined)
HTMLMediaElement.prototype.pause = vi.fn()

beforeEach(() => {
  vi.clearAllMocks()
})
