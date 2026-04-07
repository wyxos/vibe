import { describe, expect, it } from 'vitest'

import { highlightDocumentationCode } from '@/demo/documentationCode'

describe('documentationCode', () => {
  it('adds token spans for TypeScript snippets', () => {
    const html = highlightDocumentationCode(
      `import { createApp } from 'vue'

const active = true`,
      'ts',
    )

    expect(html).toContain('<span class="text-[#ff7ab8]">import</span>')
    expect(html).toContain('<span class="text-[#a9dc76]">\'vue\'</span>')
  })

  it('adds token spans for Vue snippets', () => {
    const html = highlightDocumentationCode(
      `<VibeLayout :resolve="resolve">
  <template #grid-footer>
    <div>{{ label }}</div>
  </template>
</VibeLayout>`,
      'vue',
    )

    expect(html).toContain('<span class="text-[#ff6188]">&lt;VibeLayout</span>')
    expect(html).toContain('<span class="text-[#ab9df2]">#grid-footer</span>')
    expect(html).toContain('<span class="text-[#fc9867]">{{ label }}</span>')
  })

  it('adds token spans for bash snippets', () => {
    const html = highlightDocumentationCode('npm i @wyxos/vibe', 'bash')

    expect(html).toContain('<span class="text-[#78dce8]">npm</span>')
  })
})
