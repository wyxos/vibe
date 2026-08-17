import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

describe('masonry reel transition styles', () => {
  it('uses a reversible left sheet transition', async () => {
    const styles = await readFile(resolve(process.cwd(), 'src/vibe.css'), 'utf8')

    expect(styles).toContain(`.vibe-reel-viewer-enter-active,
.vibe-reel-viewer-leave-active {
  transition: transform 160ms ease-out;
  will-change: transform;
}`)
    expect(styles).toContain(`.vibe-reel-viewer-enter-from,
.vibe-reel-viewer-leave-to {
  transform: translateX(-100%);
}`)
    expect(styles).not.toContain('--vibe-reel-origin-')
    expect(styles).not.toContain('clip-path 420ms')
  })

  it('removes the sheet travel for reduced motion', async () => {
    const styles = await readFile(resolve(process.cwd(), 'src/vibe.css'), 'utf8')
    const reducedMotion = styles.slice(styles.indexOf(
      '@media (prefers-reduced-motion: reduce)',
    ))

    expect(reducedMotion).toContain('.vibe-reel-viewer-enter-active,')
    expect(reducedMotion).toContain('.vibe-reel-viewer-leave-active,')
    expect(reducedMotion).toContain('transition: none;')
  })
})
