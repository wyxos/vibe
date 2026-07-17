<script setup lang="ts">
import { Lock, LockOpen, Pause, Play, Square } from 'lucide-vue-next'
import { computed, ref, shallowRef } from 'vue'
import { RouterLink, RouterView, useRoute } from 'vue-router'

import type { VibeInstance, VibeState } from '@/index'

const route = useRoute()
const infiniteScroll = ref(true)
const demoVibe = shallowRef<VibeInstance | null>(null)
const vibeState = shallowRef<VibeState | null>(null)

const lifecycle = computed(() => vibeState.value?.lifecycle ?? 'loading')

const lifecycleLabel = computed(() => (
  lifecycle.value.charAt(0).toUpperCase() + lifecycle.value.slice(1)
))

const layoutLabel = computed(() => (
  vibeState.value?.layout === 'reel' ? 'Reel' : 'Masonry'
))

const autofillLabel = computed(() => {
  const status = vibeState.value?.autofill.status ?? 'idle'
  return status.charAt(0).toUpperCase() + status.slice(1)
})

const autofillProgress = computed(() => {
  const autofill = vibeState.value?.autofill
  if (!autofill?.pageSize) return ''
  return `${autofill.received} / ${autofill.pageSize}`
})

function delayLabel(milliseconds: number | null | undefined): string {
  if (milliseconds == null) return ''
  return `Next in ${Math.max(1, Math.ceil(milliseconds / 1_000))}s`
}

const autofillDelay = computed(() => (
  delayLabel(vibeState.value?.autofill.delayRemainingMs)
))

const fillLabel = computed(() => {
  const status = vibeState.value?.fill.status ?? 'idle'
  return status.charAt(0).toUpperCase() + status.slice(1)
})

const fillProgress = computed(() => {
  const fill = vibeState.value?.fill
  if (!fill?.target) return ''
  return 'pages' in fill.target
    ? `${fill.completedPages} / ${fill.target.pages} pages`
    : `${fill.completedPages} pages`
})

const fillDelay = computed(() => (
  delayLabel(vibeState.value?.fill.delayRemainingMs)
))

const isAutoScrollDemo = computed(() => route.name === 'demo-auto-scroll')
const autoScroll = computed(() => vibeState.value?.autoScroll ?? null)

function toggleAutoScroll(): void {
  const state = autoScroll.value
  if (!state) return
  demoVibe.value?.setAutoScroll(!state.enabled, state.speedPxPerSecond)
}

function toggleAutoScrollPause(): void {
  const state = autoScroll.value
  if (!state?.enabled) return
  if (state.paused) demoVibe.value?.resumeAutoScroll()
  else demoVibe.value?.pauseAutoScroll()
}

function toggleLoadMoreLock(): void {
  if (!demoVibe.value) return
  demoVibe.value.setLoadMoreLocked(!vibeState.value?.loadMoreLocked)
}

function updateAutoScrollSpeed(event: Event): void {
  const input = event.currentTarget
  if (input instanceof HTMLInputElement) {
    demoVibe.value?.setAutoScrollSpeed(Number(input.value))
  }
}

function updateVibeState(state: VibeState): void {
  vibeState.value = state
}

function updateVibeInstance(instance: VibeInstance | null): void {
  demoVibe.value = instance
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

      <div
        class="app-header-actions"
        :class="{
          'app-header-actions--auto-scroll': isAutoScrollDemo,
          'app-header-actions--operation': vibeState?.autofill.enabled || vibeState?.fill.enabled,
        }"
      >
        <output
          class="vibe-lifecycle vibe-lifecycle--feed"
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

        <div
          v-if="isAutoScrollDemo"
          class="auto-scroll-controls"
          data-test="auto-scroll-controls"
        >
          <button
            class="auto-scroll-action"
            type="button"
            :disabled="!autoScroll || !demoVibe"
            :aria-label="autoScroll?.enabled ? 'Stop auto scroll' : 'Start auto scroll'"
            @click="toggleAutoScroll"
          >
            <Square v-if="autoScroll?.enabled" :size="14" aria-hidden="true" />
            <Play v-else :size="14" aria-hidden="true" />
            <span>{{ autoScroll?.enabled ? 'Stop' : 'Start' }}</span>
          </button>

          <button
            class="auto-scroll-action"
            type="button"
            :disabled="!autoScroll?.enabled || !demoVibe"
            :aria-label="autoScroll?.paused ? 'Resume auto scroll' : 'Pause auto scroll'"
            @click="toggleAutoScrollPause"
          >
            <Play v-if="autoScroll?.paused" :size="14" aria-hidden="true" />
            <Pause v-else :size="14" aria-hidden="true" />
            <span>{{ autoScroll?.paused ? 'Resume' : 'Pause' }}</span>
          </button>

          <button
            class="auto-scroll-action"
            type="button"
            :disabled="!demoVibe"
            :aria-label="vibeState?.loadMoreLocked
              ? 'Unlock loading more'
              : 'Lock loading more'"
            :aria-pressed="vibeState?.loadMoreLocked ?? false"
            @click="toggleLoadMoreLock"
          >
            <LockOpen v-if="vibeState?.loadMoreLocked" :size="14" aria-hidden="true" />
            <Lock v-else :size="14" aria-hidden="true" />
            <span>{{ vibeState?.loadMoreLocked ? 'Unlock loading' : 'Lock loading' }}</span>
          </button>

          <label class="auto-scroll-speed">
            <span>Speed</span>
            <input
              data-test="auto-scroll-speed"
              type="range"
              :disabled="!autoScroll || !demoVibe"
              :min="autoScroll?.minSpeedPxPerSecond ?? 20"
              :max="autoScroll?.maxSpeedPxPerSecond ?? 240"
              :value="autoScroll?.speedPxPerSecond ?? 80"
              @input="updateAutoScrollSpeed"
            >
            <output>{{ autoScroll?.speedPxPerSecond ?? 80 }} px/s</output>
          </label>
        </div>

        <output
          v-if="vibeState?.fill.enabled"
          class="vibe-lifecycle vibe-fill-lifecycle"
          :class="`vibe-fill-lifecycle--${vibeState.fill.status}`"
          data-test="fill-lifecycle"
          aria-live="polite"
          aria-atomic="true"
        >
          <span class="vibe-lifecycle-indicator" aria-hidden="true" />
          <span class="vibe-fill-prefix">Fill</span>
          <span class="vibe-lifecycle-separator" aria-hidden="true">·</span>
          <span>{{ fillLabel }}</span>
          <span v-if="fillProgress" class="vibe-operation-progress">
            {{ fillProgress }}
          </span>
          <span
            v-if="fillDelay"
            class="vibe-operation-delay"
            data-test="fill-delay"
          >
            {{ fillDelay }}
          </span>
        </output>

        <output
          v-if="vibeState?.autofill.enabled"
          class="vibe-lifecycle vibe-autofill-lifecycle"
          :class="`vibe-autofill-lifecycle--${vibeState.autofill.status}`"
          data-test="autofill-lifecycle"
          aria-live="polite"
          aria-atomic="true"
        >
          <span class="vibe-lifecycle-indicator" aria-hidden="true" />
          <span class="vibe-autofill-prefix">Autofill</span>
          <span class="vibe-lifecycle-separator" aria-hidden="true">·</span>
          <span>{{ autofillLabel }}</span>
          <span class="vibe-autofill-progress">{{ autofillProgress }}</span>
          <span
            v-if="autofillDelay"
            class="vibe-operation-delay"
            data-test="autofill-delay"
          >
            {{ autofillDelay }}
          </span>
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
        @vibe-instance-change="updateVibeInstance"
        @vibe-state-change="updateVibeState"
      />
    </RouterView>
  </div>
</template>
