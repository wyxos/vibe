import { createApp, defineComponent, h, nextTick, reactive } from 'vue'

import { useVibeRootDataSource, type VibeRootAutoProps } from '@/components/vibe-root/useVibeRootDataSource'

export interface MountedUseVibeRootDataSource {
  api: ReturnType<typeof useVibeRootDataSource>
  emitted: number[]
  props: VibeRootAutoProps
  flush: () => Promise<void>
  unmount: () => void
}

export async function mountUseVibeRootDataSource(initialProps: VibeRootAutoProps): Promise<MountedUseVibeRootDataSource> {
  const emitted: number[] = []
  const props = reactive({
    pageSize: 25,
    ...initialProps,
  }) as VibeRootAutoProps

  let api!: ReturnType<typeof useVibeRootDataSource>

  const container = document.createElement('div')
  document.body.appendChild(container)

  const app = createApp(defineComponent({
    setup() {
      api = useVibeRootDataSource(props, (_event, value) => {
        emitted.push(value)
      })

      return () => h('div')
    },
  }))

  app.mount(container)
  await flushDataSource()

  return {
    api,
    emitted,
    props,
    flush: flushDataSource,
    unmount() {
      app.unmount()
      container.remove()
    },
  }
}

async function flushDataSource() {
  await nextTick()
  await Promise.resolve()
  await nextTick()
  await Promise.resolve()
  await nextTick()
}
