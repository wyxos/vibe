<script setup lang="ts">
import {
  onBeforeUnmount,
  onMounted,
  ref,
  shallowRef,
} from 'vue'

import { getFakeMediaPage } from '@/demo/fakeServer'
import { createVibe, type VibeInstance, type VibeLayout } from '@/index'
import { shouldForceSingleColumnForElement } from '@/demo/responsiveFeed'

const appElement = shallowRef<HTMLElement | null>(null)
const vibeTarget = shallowRef<HTMLElement | null>(null)
const infiniteScroll = ref(true)
let vibe: VibeInstance | null = null
let responsiveResizeObserver: ResizeObserver | null = null

function responsiveLayout(): VibeLayout {
  const element = appElement.value

  return element && shouldForceSingleColumnForElement(element)
    ? 'reel'
    : 'masonry'
}

function updateResponsiveMode(): void {
  vibe?.setLayout(responsiveLayout())
}

function onInfiniteScrollChange(): void {
  vibe?.setInfiniteScroll(infiniteScroll.value)
}

onMounted(async () => {
  const target = vibeTarget.value
  const shell = appElement.value
  if (!target || !shell) return

  vibe = createVibe({
    target,
    layout: responsiveLayout(),
    infiniteScroll: infiniteScroll.value,
    loadPage: async ({ cursor }) => {
      const page = await getFakeMediaPage(cursor)

      return {
        items: page.items,
        next: page.meta.next,
        total: page.meta.total,
      }
    },
  })

  window.addEventListener('resize', updateResponsiveMode)
  if (typeof ResizeObserver !== 'undefined') {
    responsiveResizeObserver = new ResizeObserver(updateResponsiveMode)
    responsiveResizeObserver.observe(shell)
  }

  await vibe.mount()
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', updateResponsiveMode)
  responsiveResizeObserver?.disconnect()
  vibe?.destroy()
  vibe = null
})

defineExpose({
  getVibeState: () => vibe?.getState() ?? null,
  infiniteScroll,
})
</script>

<template>
  <div
    ref="appElement"
    class="app-shell"
  >
    <header class="app-header">
      <h1 class="app-title">
        Vibe
      </h1>

      <label class="toggle-control">
        <span>Infinite scroll</span>
        <input
          v-model="infiniteScroll"
          data-test="infinite-scroll-toggle"
          class="toggle-input"
          type="checkbox"
          @change="onInfiniteScrollChange"
        >
        <span
          class="toggle-track"
          aria-hidden="true"
        >
          <span class="toggle-thumb" />
        </span>
      </label>
    </header>

    <main
      ref="vibeTarget"
      class="vibe-host"
      aria-label="Vibe demo"
    />
  </div>
</template>
