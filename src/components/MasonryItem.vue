<script lang="ts">
import { defineComponent, getCurrentInstance, inject } from 'vue'
import { masonryItemRegistryKey } from '@/components/masonryItemRegistry'

let hasWarnedOutsideMasonry = false
let hasWarnedRegistryMismatch = false

export default defineComponent({
  name: 'MasonryItem',
  setup(_props, { slots, attrs }) {
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

    const onPreloaded = attrs.onPreloaded
    const onFailed = attrs.onFailed

    const overlaySlot = slots.overlay
    const legacyDefaultSlot = slots.default

    if (import.meta.env.DEV && !overlaySlot && legacyDefaultSlot) {
      console.warn('[MasonryItem] The #default slot is deprecated for item bodies. Use #overlay instead.')
    }

    register({
      header: slots.header,
      loader: slots.loader,
      overlay: overlaySlot ?? legacyDefaultSlot,
      error: slots.error,
      footer: slots.footer,
      onPreloaded:
        typeof onPreloaded === 'function'
          ? (onPreloaded as (item: unknown) => void)
          : Array.isArray(onPreloaded)
            ? (item) => {
                for (const fn of onPreloaded) {
                  if (typeof fn === 'function') (fn as (v: unknown) => void)(item)
                }
              }
            : undefined,
      onFailed:
        typeof onFailed === 'function'
          ? (onFailed as (payload: unknown) => void)
          : Array.isArray(onFailed)
            ? (payload) => {
                for (const fn of onFailed) {
                  if (typeof fn === 'function') (fn as (v: unknown) => void)(payload)
                }
              }
            : undefined,
    })

    return () => null
  },
})
</script>
