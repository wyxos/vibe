import { createApp, defineComponent, h, nextTick, ref } from 'vue'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { useVibeRootActivation } from '@/components/vibe-root/useVibeRootActivation'

describe('useVibeRootActivation', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('wires resize and keydown listeners only while enabled', async () => {
    const enabled = ref(true)
    const onDisable = vi.fn()
    const onEnable = vi.fn(async () => {})
    const onKeydown = vi.fn()
    const onResize = vi.fn()

    const harness = mountActivationHarness({
      enabled,
      onDisable,
      onEnable,
      onKeydown,
      onResize,
    })

    await harness.flush()

    const initialKeydownCalls = onKeydown.mock.calls.length
    const initialResizeCalls = onResize.mock.calls.length
    const initialEnableCalls = onEnable.mock.calls.length

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }))
    window.dispatchEvent(new Event('resize'))
    await harness.flush()

    expect(onKeydown.mock.calls.length).toBe(initialKeydownCalls + 1)
    expect(onResize.mock.calls.length).toBeGreaterThan(initialResizeCalls)
    expect(onEnable.mock.calls.length).toBeGreaterThanOrEqual(initialEnableCalls)

    enabled.value = false
    await harness.flush()

    const disabledKeydownCalls = onKeydown.mock.calls.length
    const disabledResizeCalls = onResize.mock.calls.length

    expect(onDisable).toHaveBeenCalled()

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }))
    window.dispatchEvent(new Event('resize'))
    await harness.flush()

    expect(onKeydown.mock.calls.length).toBe(disabledKeydownCalls)
    expect(onResize.mock.calls.length).toBe(disabledResizeCalls)

    enabled.value = true
    await harness.flush()

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp' }))
    await harness.flush()

    expect(onKeydown.mock.calls.length).toBe(disabledKeydownCalls + 1)

    harness.unmount()

    const unmountedKeydownCalls = onKeydown.mock.calls.length
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp' }))
    await flush()

    expect(onKeydown.mock.calls.length).toBe(unmountedKeydownCalls)
  })
})

function mountActivationHarness(options: {
  enabled: ReturnType<typeof ref<boolean>>
  onDisable: () => void
  onEnable: () => Promise<void> | void
  onKeydown: (event: KeyboardEvent) => void
  onResize: () => void
}) {
  const container = document.createElement('div')
  document.body.appendChild(container)

  const app = createApp(defineComponent({
    setup() {
      useVibeRootActivation({
        enabled: options.enabled,
        onDisable: options.onDisable,
        onEnable: options.onEnable,
        onKeydown: options.onKeydown,
        onResize: options.onResize,
      })

      return () => h('div')
    },
  }))

  app.mount(container)

  return {
    flush,
    unmount() {
      app.unmount()
      container.remove()
    },
  }
}

async function flush() {
  await nextTick()
  await Promise.resolve()
  await nextTick()
}
