<script setup lang="ts">
import { onMounted, shallowRef } from 'vue'

import {
  getFakeMediaPage,
  type FakeMediaPage,
} from '@/demo/fakeServer'

const mediaPage = shallowRef<FakeMediaPage | null>(null)
const mediaPageError = shallowRef<unknown>(null)

function isVideo(src: string): boolean {
  try {
    return /\.(mp4|webm|mov)$/i.test(new URL(src).pathname)
  } catch {
    return /\.(mp4|webm|mov)(?:$|\?)/i.test(src)
  }
}

onMounted(async () => {
  try {
    mediaPage.value = await getFakeMediaPage(null)
  } catch (error: unknown) {
    mediaPageError.value = error
  }
})

defineExpose({ mediaPage, mediaPageError })
</script>

<template>
  <main class="gallery-shell">
    <p
      v-if="mediaPageError"
      class="gallery-status"
      role="alert"
    >
      Unable to load media.
    </p>

    <p
      v-else-if="!mediaPage"
      class="gallery-status"
      role="status"
    >
      Loading media…
    </p>

    <p
      v-else-if="mediaPage.items.length === 0"
      class="gallery-status"
    >
      No media found.
    </p>

    <section
      v-else
      class="masonry"
      aria-label="Media gallery"
    >
      <article
        v-for="group in mediaPage.items"
        :key="group.postId"
        class="masonry-item"
      >
        <template
          v-for="item in group.items"
          :key="item.src"
        >
          <video
            v-if="isVideo(item.preview.src)"
            class="media-preview"
            :src="item.preview.src"
            :width="item.preview.width ?? undefined"
            :height="item.preview.height ?? undefined"
            autoplay
            loop
            muted
            playsinline
            preload="metadata"
          />

          <img
            v-else
            class="media-preview"
            :src="item.preview.src"
            :width="item.preview.width ?? undefined"
            :height="item.preview.height ?? undefined"
            alt=""
            decoding="async"
          >
        </template>
      </article>
    </section>
  </main>
</template>

<style scoped>
:global(*) {
  box-sizing: border-box;
}

:global(html) {
  min-width: 320px;
  color-scheme: dark;
  background: #080808;
}

:global(body) {
  min-width: 320px;
  min-height: 100vh;
  margin: 0;
  background: #080808;
}

.gallery-shell {
  min-height: 100vh;
  padding: clamp(0.375rem, 1vw, 0.875rem);
}

.gallery-status {
  display: grid;
  min-height: calc(100vh - 1.75rem);
  margin: 0;
  place-items: center;
  color: #a3a3a3;
  font: 500 0.875rem/1.5 system-ui, sans-serif;
}

.masonry {
  column-gap: clamp(0.375rem, 0.75vw, 0.75rem);
  columns: 15rem;
}

.masonry-item {
  overflow: hidden;
  margin: 0 0 clamp(0.375rem, 0.75vw, 0.75rem);
  break-inside: avoid;
  border-radius: 0.5rem;
  background: #171717;
}

.media-preview {
  display: block;
  width: 100%;
  height: auto;
  background: #171717;
}

.media-preview + .media-preview {
  border-top: 2px solid #080808;
}
</style>
