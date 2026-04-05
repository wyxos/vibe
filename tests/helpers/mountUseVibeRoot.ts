import { createApp, defineComponent, h, nextTick, reactive } from 'vue'

import { useVibeRoot, type VibeRootProps } from '@/components/vibe-root/useVibeRoot'

export interface MountedUseVibeRoot {
  api: ReturnType<typeof useVibeRoot>
  emitted: number[]
  props: VibeRootProps
  flush: () => Promise<void>
  unmount: () => void
}

export async function mountUseVibeRoot(initialProps: VibeRootProps): Promise<MountedUseVibeRoot> {
  const emitted: number[] = []
  const props = reactive({
    activeIndex: 0,
    hasNextPage: false,
    loading: false,
    ...initialProps,
  }) as VibeRootProps

  let api!: ReturnType<typeof useVibeRoot>

  const container = document.createElement('div')
  document.body.appendChild(container)

  const app = createApp(defineComponent({
    setup() {
      api = useVibeRoot(props, (_event, value) => {
        emitted.push(value)
      })

      return () => h('div')
    },
  }))

  app.mount(container)
  await flushViewer()

  return {
    api,
    emitted,
    props,
    flush: flushViewer,
    unmount() {
      app.unmount()
      container.remove()
    },
  }
}

async function flushViewer() {
  await nextTick()
  await Promise.resolve()
  await nextTick()
}
