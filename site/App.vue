<script setup lang="ts">
import { ArrowDown, ArrowUpRight, Check, Copy, GalleryHorizontalEnd, Grid2X2, Pause, Play, RotateCcw } from 'lucide-vue-next'
import { ref } from 'vue'
import { useShowcase } from './useShowcase'
import type { ShowcaseFilter } from './useShowcase'

const target = ref<HTMLElement | null>(null)
const { filter, layout, loaded, rendered, busy, status, autoScrolling, error,
  chooseFilter, chooseLayout, toggleAutoScroll, reset } = useShowcase(target)
const copied = ref(false)
const copyError = ref(false)
const install = 'npm install @wyxos/vibe'
const filters: { value: ShowcaseFilter; label: string }[] = [
  { value: 'all', label: 'All media' }, { value: 'image', label: 'Images' },
  { value: 'video', label: 'Motion' }, { value: 'audio', label: 'Sound' },
]
async function copyInstall() {
  try { await navigator.clipboard.writeText(install); copied.value = true; copyError.value = false }
  catch { copyError.value = true }
}
</script>

<template>
  <div class="showcase-page">
    <header class="site-header">
      <a class="wordmark" href="#top" aria-label="Vibe home">
        <svg class="brand-mark" viewBox="0 0 30 30" fill="none" aria-hidden="true">
          <path d="M2 5h7l6 16 6-16h7L18 27h-6L2 5Z" fill="currentColor" />
          <path d="M12 2h6v7h-6z" fill="var(--coral)" />
        </svg>
        <span>vibe<span class="brand-dot">.</span></span>
      </a>
      <span class="header-caption">A Vue media library</span>
      <nav class="header-links" aria-label="Project">
        <a href="https://github.com/wyxos/vibe" target="_blank" rel="noopener noreferrer">GitHub <ArrowUpRight :size="14" aria-hidden="true" /></a>
        <button class="header-install" type="button" @click="copyInstall">
          <Check v-if="copied" :size="14" aria-hidden="true" /><Copy v-else :size="14" aria-hidden="true" />
          {{ copied ? 'Copied' : 'Get Vibe' }}
        </button>
      </nav>
    </header>

    <main id="top">
      <section class="showcase-intro" aria-labelledby="page-heading">
        <div>
          <h1 id="page-heading">Keep the good stuff coming<span>.</span></h1>
          <p>A media feed that keeps its flow. Scroll, explore, and let the next page find you.</p>
        </div>
        <div class="intro-note"><span class="live-dot" aria-hidden="true" /><span>Real library.<br>Live playground.</span></div>
      </section>

      <section class="playground" aria-label="Live Vibe demonstration">
        <div class="playground-toolbar">
          <div class="filter-tabs" role="group" aria-label="Media type">
            <button
              v-for="option in filters" :key="option.value" type="button"
              :data-test="`filter-${option.value}`" :aria-pressed="filter === option.value"
              @click="chooseFilter(option.value)"
            >{{ option.label }}</button>
          </div>
          <div class="playground-actions">
            <div class="layout-toggle" role="group" aria-label="Feed layout">
              <button type="button" aria-label="Masonry layout" title="Masonry layout" data-test="layout-masonry" :aria-pressed="layout === 'masonry'" @click="chooseLayout('masonry')"><Grid2X2 :size="17" aria-hidden="true" /></button>
              <button type="button" aria-label="Reel layout" title="Reel layout" data-test="layout-reel" :aria-pressed="layout === 'reel'" @click="chooseLayout('reel')"><GalleryHorizontalEnd :size="17" aria-hidden="true" /></button>
            </div>
            <button class="auto-scroll-button" type="button" data-test="auto-scroll" :aria-pressed="autoScrolling" @click="toggleAutoScroll">
              <Pause v-if="autoScrolling" :size="14" aria-hidden="true" /><Play v-else :size="14" aria-hidden="true" />
              <span>{{ autoScrolling ? 'Pause' : 'Auto scroll' }}</span>
            </button>
            <button class="reset-button" type="button" aria-label="Restart demo" title="Restart demo" data-test="reset-demo" @click="reset"><RotateCcw :size="16" aria-hidden="true" /></button>
          </div>
        </div>

        <div
          class="showcase-stage" data-test="showcase-stage"
          :data-loaded="loaded" :data-rendered="rendered" :data-layout="layout" :data-loading="busy"
        >
          <div ref="target" class="showcase-feed" data-test="showcase-feed" aria-label="Explore the infinite media feed" :aria-busy="busy" />
          <div v-if="error" class="showcase-error" role="alert">{{ error }} <button type="button" @click="reset">Restart</button></div>
          <div class="stage-status-bar">
            <span class="stage-hint"><ArrowDown :size="12" aria-hidden="true" /> Scroll to keep exploring</span>
            <span class="stage-counters"><span><b data-test="loaded-count">{{ loaded }}</b> loaded</span><span><b data-test="rendered-count">{{ rendered }}</b> rendered</span></span>
            <span class="stage-status" :class="{ 'is-busy': busy }" data-test="request-state" role="status"><span class="status-dot" aria-hidden="true" />{{ status }}</span>
          </div>
        </div>
        <div class="playground-caption"><span>Original fixtures repeat · 450 ms simulated page latency</span><span>Click any item to open the reel. <kbd>Esc</kbd> to return.</span></div>
      </section>

      <section class="integration-strip" aria-label="Use Vibe in your project">
        <div><h2>Your media. Your interface.</h2><p>Masonry, reels and continuous loading, from one Vue library.</p></div>
        <button class="install-command" type="button" @click="copyInstall"><code>{{ install }}</code><Check v-if="copied" :size="17" aria-label="Copied" /><Copy v-else :size="17" aria-label="Copy install command" /></button>
        <p v-if="copyError" class="copy-error" role="alert">Copy is unavailable. Select this command: <code>{{ install }}</code></p>
      </section>
    </main>
    <footer class="site-footer"><span>Vibe, by Wyxos.</span><span>Made for the way media moves.</span></footer>
  </div>
</template>
