<script setup lang="ts">
import { ExternalLink, X } from 'lucide-vue-next'
import { computed } from 'vue'
import type { VibeReelInfoSheetProps } from '../../src/index'
import type { ShowcaseItem } from '../fixtures'

const props = defineProps<VibeReelInfoSheetProps>()
const item = computed(() => props.item as ShowcaseItem)
const method = computed(() => /\/image-0[1-4]\.(?:png|webp)(?:[?#]|$)/.test(props.mediaItem.src)
  ? 'AI-generated image' : 'Original procedural media')
const provenanceUrl = `${import.meta.env.BASE_URL}media/provenance.json`
</script>

<template>
  <section class="provenance-sheet" aria-label="About this media" data-test="media-information">
    <header class="provenance-sheet-header">
      <h2>{{ item.title }}</h2>
      <button class="sheet-close" type="button" aria-label="Close information" @click="close">
        <X :size="19" aria-hidden="true" />
      </button>
    </header>
    <div class="provenance-sheet-body">
      <p>{{ item.description }}</p>
      <dl>
        <div><dt>Collection</dt><dd>{{ item.collection }}</dd></div>
        <div><dt>Created with</dt><dd>{{ method }}</dd></div>
        <div><dt>Media in this post</dt><dd>{{ mediaCount }}</dd></div>
        <div v-if="mediaItem.width && mediaItem.height">
          <dt>Dimensions</dt><dd>{{ mediaItem.width }} × {{ mediaItem.height }}</dd>
        </div>
      </dl>
      <p class="provenance-note">Every image, motion study and sound in this collection was made for Vibe.</p>
      <p class="provenance-note">This original collection repeats as you scroll. Page loading is simulated to demonstrate loading states.</p>
    </div>
    <footer class="provenance-sheet-footer">
      <a :href="provenanceUrl" target="_blank" rel="noopener noreferrer">
        View asset provenance <ExternalLink :size="14" aria-hidden="true" />
      </a>
    </footer>
  </section>
</template>
