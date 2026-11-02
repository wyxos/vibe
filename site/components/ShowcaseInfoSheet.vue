<script setup lang="ts">
import { ExternalLink, X } from 'lucide-vue-next'
import { computed } from 'vue'
import type { VibeReelInfoSheetProps } from '../../src/index'
import type { ShowcaseItem } from '../fixtures'

const props = defineProps<VibeReelInfoSheetProps>()
const item = computed(() => props.item as ShowcaseItem)
const method = computed(() => item.value.credit ? 'Licensed media' : /\/image-0[1-4]\.(?:png|webp)(?:[?#]|$)/.test(props.mediaItem.src)
  ? 'AI-generated image' : 'Original procedural media')
const provenanceUrl = computed(() => `${import.meta.env.BASE_URL}media/${item.value.credit ? 'catalogue.json' : 'provenance.json'}`)
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
        <template v-if="item.credit">
          <div><dt>Credit</dt><dd>{{ item.credit.author }}</dd></div>
          <div><dt>License</dt><dd><a :href="item.credit.licenseUrl" target="_blank" rel="noopener noreferrer">{{ item.credit.license }}</a></dd></div>
          <div><dt>Source</dt><dd><a :href="item.credit.sourceUrl" target="_blank" rel="noopener noreferrer">Wikimedia Commons</a></dd></div>
        </template>
        <div><dt>Media in this post</dt><dd>{{ mediaCount }}</dd></div>
        <div v-if="mediaItem.width && mediaItem.height">
          <dt>Dimensions</dt><dd>{{ mediaItem.width }} × {{ mediaItem.height }}</dd>
        </div>
      </dl>
      <p v-if="item.credit" class="provenance-note">{{ item.credit.changes }}</p>
      <p class="provenance-note">This collection combines original work with openly licensed media. Licensed items retain their individual credits and licenses.</p>
      <p class="provenance-note">The collection repeats after you have explored the available items. Page loading is simulated to demonstrate loading states.</p>
    </div>
    <footer class="provenance-sheet-footer">
      <a :href="provenanceUrl" target="_blank" rel="noopener noreferrer">
        View asset provenance <ExternalLink :size="14" aria-hidden="true" />
      </a>
    </footer>
  </section>
</template>
