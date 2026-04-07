import { createApp, defineComponent, h, nextTick, reactive } from 'vue'

import { useDataSource, type VibeAutoProps } from '@/components/viewer-core/useDataSource'

export interface MountedUseDataSource {
  api: ReturnType<typeof useDataSource>
  emitted: number[]
  props: VibeAutoProps
  flush: () => Promise<void>
  unmount: () => void
}

export async function mountUseDataSource(initialProps: VibeAutoProps): Promise<MountedUseDataSource> {
  const emitted: number[] = []
  const props = reactive({
    pageSize: 25,
    ...initialProps,
  }) as VibeAutoProps

  let api!: ReturnType<typeof useDataSource>

  const container = document.createElement('div')
  document.body.appendChild(container)

  const app = createApp(defineComponent({
    setup() {
      api = useDataSource(props, (_event, value) => {
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
