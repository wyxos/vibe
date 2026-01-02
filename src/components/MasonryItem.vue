<script lang="ts">
import { defineComponent, inject } from 'vue'
import { masonryItemRegistryKey } from '@/components/masonryItemRegistry'

export default defineComponent({
  name: 'MasonryItem',
  setup(_props, { slots }) {
    const register = inject(masonryItemRegistryKey, null)

    if (!register) {
      if (import.meta.env.DEV) {
        console.warn('[MasonryItem] Must be used as a child of <Masonry>.')
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
