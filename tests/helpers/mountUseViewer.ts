import { createApp, defineComponent, h, nextTick, reactive } from 'vue'

import { useViewer, type VibeControlledProps } from '@/components/viewer-core/useViewer'

export interface MountedUseViewer {
  api: ReturnType<typeof useViewer>
  emitted: number[]
  props: VibeControlledProps
  flush: () => Promise<void>
  unmount: () => void
}

export async function mountUseViewer(initialProps: VibeControlledProps): Promise<MountedUseViewer> {
  const emitted: number[] = []
  const props = reactive({
    activeIndex: 0,
    hasNextPage: false,
    loading: false,
    ...initialProps,
  }) as VibeControlledProps

  let api!: ReturnType<typeof useViewer>

  const container = document.createElement('div')
  document.body.appendChild(container)

  const app = createApp(defineComponent({
    setup() {
      api = useViewer(props, (_event, value) => {
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
