import { describe, expect, it, vi } from 'vitest'
import {
  Masonry,
  MasonryItem,
  MasonryVideoControls,
  VibePlugin,
} from '@/index'

describe('package exports', () => {
  it('exports the public components and plugin install surface', () => {
    expect(Masonry).toBeTruthy()
    expect(MasonryItem).toBeTruthy()
    expect(MasonryVideoControls).toBeTruthy()
    expect(VibePlugin).toBeTruthy()
    expect(typeof VibePlugin.install).toBe('function')

    const component = vi.fn()
    const install = VibePlugin.install
    expect(install).toBeTypeOf('function')
    install?.({ component } as never)

    expect(component).toHaveBeenCalledTimes(3)
    expect(component).toHaveBeenNthCalledWith(1, 'Masonry', Masonry)
    expect(component).toHaveBeenNthCalledWith(2, 'MasonryItem', MasonryItem)
    expect(component).toHaveBeenNthCalledWith(3, 'MasonryVideoControls', MasonryVideoControls)
  })
})
