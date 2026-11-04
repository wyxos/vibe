<script setup lang="ts">
import { Github, Minus, PanelsTopLeft, Plus, RotateCcw } from 'lucide-vue-next'
import { ref } from 'vue'
import { useShowcase } from './useShowcase'
import ShowcaseReelBackButton from './components/ShowcaseReelBackButton.vue'
import type { ShowcaseFilter } from './useShowcase'

const target = ref<HTMLElement | null>(null)
const logoUrl = `${import.meta.env.BASE_URL}logo.svg`
const { filter, layout, loaded, rendered, busy, status, error, reelTarget, reelPreviews, previewPlacement, previewCount, previewTransition,
  chooseFilter, closeReel, reset, toggleReelPreviews } = useShowcase(target)
const placements = ['left', 'right', 'top', 'bottom'] as const
const filters: { value: ShowcaseFilter; label: string }[] = [
  { value: 'all', label: 'All media' }, { value: 'image', label: 'Images' },
  { value: 'video', label: 'Motion' }, { value: 'audio', label: 'Sound' },
]
</script>

<template>
  <div class="showcase-page">
    <header class="site-header">
      <a class="wordmark" href="#top" aria-label="Vibe home">
        <img class="brand-mark" :src="logoUrl" alt="" width="36" height="36">
        <span>Vibe</span>
      </a>
      <div class="filter-tabs" role="group" aria-label="Media type">
        <button
          v-for="option in filters" :key="option.value" type="button"
          :data-test="`filter-${option.value}`" :aria-pressed="filter === option.value"
          @click="chooseFilter(option.value)"
        >{{ option.label }}</button>
      </div>
      <div class="playground-actions">
        <button class="reset-button" type="button" aria-label="Restart demo" title="Restart demo" data-test="reset-demo" @click="reset"><RotateCcw :size="16" aria-hidden="true" /></button>
        <a class="project-link" href="https://github.com/wyxos/vibe" target="_blank" rel="noopener noreferrer" aria-label="Vibe on GitHub" title="Vibe on GitHub"><Github :size="18" aria-hidden="true" /></a>
      </div>
    </header>

    <Teleport v-if="reelTarget" :to="reelTarget">
      <div class="showcase-reel-toolbar">
        <ShowcaseReelBackButton @click="closeReel" />
        <button class="showcase-reel-back" type="button" :aria-pressed="reelPreviews" @click="toggleReelPreviews">
          <PanelsTopLeft :size="16" aria-hidden="true" />
          Upcoming previews
        </button>
      </div>
    </Teleport>

    <main id="top" class="playground" aria-label="Live Vibe demonstration">
      <h1 class="sr-only">Vibe media feed</h1>
      <div v-if="layout === 'reel'" class="showcase-preview-settings">
        <div class="filter-tabs" role="group" aria-label="Preview placement">
          <button v-for="position in placements" :key="position" type="button"
            :aria-pressed="previewPlacement === position" @click="previewPlacement = position"
          >{{ position }}</button>
        </div>
        <div class="filter-tabs" role="group" aria-label="Preview count">
          <button type="button" aria-label="Fewer previews" :disabled="previewCount <= 1" @click="previewCount--"><Minus :size="16" aria-hidden="true" /></button>
          <output aria-live="polite">{{ previewCount }} previews</output>
          <button type="button" aria-label="More previews" :disabled="previewCount >= 24" @click="previewCount++"><Plus :size="16" aria-hidden="true" /></button>
        </div>
        <div class="filter-tabs" role="group" aria-label="Preview selection transition">
          <button type="button" :aria-pressed="previewTransition === 'slide'" @click="previewTransition = 'slide'">Slide</button>
          <button type="button" :aria-pressed="previewTransition === 'none'" @click="previewTransition = 'none'">Instant</button>
        </div>
      </div>
      <div
        class="showcase-stage" data-test="showcase-stage"
        :data-loaded="loaded" :data-rendered="rendered" :data-layout="layout" :data-loading="busy"
      >
        <div ref="target" class="showcase-feed" data-test="showcase-feed" aria-label="Explore the infinite media feed" :aria-busy="busy" />
        <div v-if="error" class="showcase-error" role="alert">{{ error }} <button type="button" @click="reset">Restart</button></div>
        <div class="stage-status-bar">
          <span class="stage-counters"><span><b data-test="loaded-count">{{ loaded }}</b> loaded</span><span><b data-test="rendered-count">{{ rendered }}</b> rendered</span></span>
          <span class="stage-status" :class="{ 'is-busy': busy }" data-test="request-state" role="status"><span class="status-dot" aria-hidden="true" />{{ status }}</span>
        </div>
      </div>
    </main>
  </div>
</template>
