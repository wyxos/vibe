import { defineComponent, h } from 'vue'
import { describe, expect, it } from 'vitest'

import { createVibe } from '@/index'

describe('card region options', () => {
  it('rejects unsupported background values at runtime', () => {
    const Region = defineComponent(() => () => h('span'))

    expect(() => createVibe({
      cardFooter: {
        background: 'opaque' as 'transparent',
        component: Region,
        height: 40,
      },
      initialPage: { items: [], next: null },
      target: document.createElement('div'),
    })).toThrow(
      'Vibe cardFooter background must be "default" or "transparent".',
    )
  })
})
