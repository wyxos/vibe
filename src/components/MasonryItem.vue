<script lang="ts">
import { defineComponent, getCurrentInstance, inject } from 'vue'
import { masonryItemRegistryKey } from '@/components/masonryItemRegistry'

let hasWarnedOutsideMasonry = false
let hasWarnedRegistryMismatch = false

export default defineComponent({
  name: 'MasonryItem',
  setup(_props, { slots }) {
    const register = inject(masonryItemRegistryKey, null)

    if (!register) {
      if (import.meta.env.DEV) {
        const instance = getCurrentInstance()
        let hasMasonryAncestor = false
        let parent = instance?.parent ?? null

        while (parent) {
          const parentName = (parent.type as { name?: string } | undefined)?.name
          if (parentName === 'Masonry') {
            hasMasonryAncestor = true
            break
          }
          parent = parent.parent
        }

        if (hasMasonryAncestor) {
          if (!hasWarnedRegistryMismatch) {
            hasWarnedRegistryMismatch = true
            console.warn(
              '[MasonryItem] Detected a <Masonry> ancestor but no registry was provided. Ensure <Masonry> and <MasonryItem> come from the same build (avoid mixing source + package imports / duplicate installs).'
            )
          }
        } else if (!hasWarnedOutsideMasonry) {
          hasWarnedOutsideMasonry = true
          console.warn('[MasonryItem] Must be used as a child of <Masonry>.')
        }
      }
      return () => null
    }

    register({
      header: slots.header,
      default: slots.default,
      footer: slots.footer,
    })

    return () => null
  },
})
</script>
