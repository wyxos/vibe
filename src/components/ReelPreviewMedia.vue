<script setup lang="ts">
import { computed, ref, watch, watchEffect } from 'vue'
import { Film, ImageOff, Music } from 'lucide-vue-next'
import type { VibeReelPreview } from '../types'

const props = defineProps<{ source: VibeReelPreview; position: number }>()
const tile = ref<HTMLElement | null>(null)
const video = ref<HTMLVideoElement | null>(null)
const animate = ref(false)
const failedImage = ref(false)
const failedVideo = ref(false)
const videoSource = computed(() => props.source.type === 'video' && props.source.presentation !== 'hidden'
  ? props.source.src : null)
const imageSource = computed(() => {
  if (props.source.presentation === 'hidden') return null
  return props.source.type === 'video' ? props.source.poster : props.source.src
})

watchEffect((cleanup) => {
  if (!videoSource.value || !tile.value || typeof IntersectionObserver === 'undefined') return
  const element = tile.value
  const document = element.ownerDocument
  const motion = document.defaultView?.matchMedia('(prefers-reduced-motion: reduce)')
  let visible = false
  const update = () => { animate.value = visible && document.visibilityState === 'visible' && !motion?.matches }
  const observer = new IntersectionObserver(([entry]) => { visible = !!entry?.isIntersecting; update() })
  observer.observe(element)
  motion?.addEventListener('change', update)
  document.addEventListener('visibilitychange', update)
  cleanup(() => {
    observer.disconnect()
    motion?.removeEventListener('change', update)
    document.removeEventListener('visibilitychange', update)
    animate.value = false
  })
})
watch(videoSource, () => { failedVideo.value = false })
watch(imageSource, () => { failedImage.value = false })
watchEffect((cleanup) => {
  const element = video.value
  if (!element) return
  cleanup(() => {
    element.pause()
    element.removeAttribute('src')
    element.load()
  })
})
</script>

<template>
  <span ref="tile" class="reel-preview-media" :data-nsfw-presentation="source.presentation">
    <video
      v-if="videoSource && animate && !failedVideo"
      :key="videoSource"
      ref="video"
      :src="videoSource"
      :poster="source.poster ?? undefined"
      :aria-label="`Upcoming video ${position}`"
      muted autoplay loop playsinline disablepictureinpicture disableremoteplayback
      @error="failedVideo = true"
    />
    <img
      v-else-if="imageSource && !failedImage"
      :key="imageSource"
      :src="imageSource"
      :alt="`Upcoming item ${position}`"
      loading="lazy"
      decoding="async"
      draggable="false"
      @error="failedImage = true"
    >
    <Film v-else-if="source.type === 'video'" role="img" aria-label="Video" />
    <Music v-else-if="source.type === 'audio'" role="img" aria-label="Audio" />
    <ImageOff v-else role="img" aria-label="Preview unavailable" />
    <span v-if="source.label" class="reel-preview-label">{{ source.label }}</span>
  </span>
</template>
