<script setup lang="ts">
import { Github, RotateCcw } from 'lucide-vue-next'
import { ref } from 'vue'
import { useShowcase } from './useShowcase'
import type { ShowcaseFilter } from './useShowcase'

const target = ref<HTMLElement | null>(null)
const logoUrl = `${import.meta.env.BASE_URL}logo.svg`
const reviewEnabled = import.meta.env.DEV
const query = new URLSearchParams(window.location.search)
const variant = reviewEnabled && query.get('demo') === 'v2' ? 'v2' : 'v1'
const embedded = reviewEnabled && query.get('embedded') === '1'
const { filter, layout, loaded, rendered, busy, status, error,
  chooseFilter, reset } = useShowcase(target, { prepareReplacementMedia: variant === 'v2' })
const filters: { value: ShowcaseFilter; label: string }[] = [
  { value: 'all', label: 'All media' }, { value: 'image', label: 'Images' },
  { value: 'video', label: 'Motion' }, { value: 'audio', label: 'Sound' },
]
</script>

<template>
  <div class="showcase-page" :data-demo-variant="reviewEnabled ? variant : undefined">
    <header class="site-header" :class="{ 'site-header--review': reviewEnabled && !embedded }">
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
        <nav v-if="reviewEnabled && !embedded" class="demo-version-nav" aria-label="Demo version">
          <a href="?demo=v1" :aria-current="variant === 'v1' ? 'page' : undefined" title="V1 Current">V1</a>
          <a href="?demo=v2" :aria-current="variant === 'v2' ? 'page' : undefined" title="V2 Experimental">V2</a>
          <a href="?compare=1">Compare</a>
        </nav>
        <button class="reset-button" type="button" aria-label="Restart demo" title="Restart demo" data-test="reset-demo" @click="reset"><RotateCcw :size="16" aria-hidden="true" /></button>
        <a class="project-link" href="https://github.com/wyxos/vibe" target="_blank" rel="noopener noreferrer" aria-label="Vibe on GitHub" title="Vibe on GitHub"><Github :size="18" aria-hidden="true" /></a>
      </div>
    </header>

    <main id="top" class="playground" aria-label="Live Vibe demonstration">
      <h1 class="sr-only">Vibe media feed</h1>
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
