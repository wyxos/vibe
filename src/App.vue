<script setup lang="ts">
import { computed, ref, shallowRef } from 'vue'
import { RouterLink, RouterView } from 'vue-router'

import type { VibeState } from '@/index'

const infiniteScroll = ref(true)
const vibeState = shallowRef<VibeState | null>(null)

const lifecycle = computed(() => vibeState.value?.lifecycle ?? 'loading')

const lifecycleLabel = computed(() => (
  lifecycle.value.charAt(0).toUpperCase() + lifecycle.value.slice(1)
))

const layoutLabel = computed(() => (
  vibeState.value?.layout === 'reel' ? 'Reel' : 'Masonry'
))

function updateVibeState(state: VibeState): void {
  vibeState.value = state
}
</script>

<template>
  <div class="app-shell">
    <header class="app-header">
      <div class="app-header-navigation">
        <RouterLink class="app-title" to="/">Vibe</RouterLink>
        <nav class="app-navigation" aria-label="Primary navigation">
          <RouterLink
            class="app-nav-link"
            to="/demos/card-header-and-footer"
          >
            Demos
          </RouterLink>
        </nav>
      </div>

      <div class="app-header-actions">
        <output
          class="vibe-lifecycle"
          :class="`vibe-lifecycle--${lifecycle}`"
          data-test="vibe-lifecycle"
          aria-live="polite"
          aria-atomic="true"
        >
          <span class="vibe-lifecycle-indicator" aria-hidden="true" />
          <span class="vibe-lifecycle-layout">{{ layoutLabel }}</span>
          <span class="vibe-lifecycle-separator" aria-hidden="true">·</span>
          <span>{{ lifecycleLabel }}</span>
        </output>

        <label class="toggle-control">
          <span>Infinite scroll</span>
          <input
            v-model="infiniteScroll"
            data-test="infinite-scroll-toggle"
            class="toggle-input"
            type="checkbox"
          >
          <span class="toggle-track" aria-hidden="true">
            <span class="toggle-thumb" />
          </span>
        </label>
      </div>
    </header>

    <RouterView v-slot="{ Component }">
      <component
        :is="Component"
        :infinite-scroll="infiniteScroll"
        @vibe-state-change="updateVibeState"
      />
    </RouterView>
  </div>
</template>
