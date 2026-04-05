<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { AudioLines, Clapperboard, File, FileArchive, FileText, ImagePlus } from 'lucide-vue-next'

import type { VibeViewerItem, VibeViewerType } from './vibeViewer'

const props = withDefaults(
  defineProps<{
    items: VibeViewerItem[]
    activeIndex?: number
    loading?: boolean
    hasNextPage?: boolean
  }>(),
  {
    activeIndex: 0,
    loading: false,
    hasNextPage: false,
  },
)

const emit = defineEmits<{
  'update:activeIndex': [value: number]
}>()

const stageRef = ref<HTMLElement | null>(null)
const dragOffset = ref(0)
const isDragging = ref(false)
const viewportHeight = ref(1)

const videoElements = new Map<string, HTMLVideoElement>()
const audioElements = new Map<string, HTMLAudioElement>()

let activePointerId: number | null = null
let dragStartY = 0
let wheelLockedUntil = 0

const resolvedActiveIndex = computed(() => {
  if (props.items.length === 0) {
    return 0
  }

  return clamp(props.activeIndex ?? 0, 0, props.items.length - 1)
})

const activeItem = computed(() => props.items[resolvedActiveIndex.value] ?? null)
const stageTheme = computed(() => getTheme(activeItem.value?.type ?? 'image'))
const trackStyle = computed(() => {
  const offset = -resolvedActiveIndex.value * viewportHeight.value + dragOffset.value

  return {
    transform: `translate3d(0, ${offset}px, 0)`,
    transition: isDragging.value ? 'none' : 'transform 320ms cubic-bezier(0.22, 1, 0.36, 1)',
  }
})

const dragThreshold = computed(() => Math.min(96, viewportHeight.value * 0.15 || 96))
const statusMessage = computed(() => {
  if (props.items.length === 0 && props.loading) {
    return 'Loading the first page'
  }

  if (props.loading && props.hasNextPage) {
    return 'Loading more items'
  }

  if (isAtEnd.value && !props.hasNextPage && !props.loading) {
    return 'End of feed'
  }

  return null
})

const isAtEnd = computed(() => props.items.length > 0 && resolvedActiveIndex.value === props.items.length - 1)

watch(resolvedActiveIndex, async () => {
  await syncMediaPlayback()
})

watch(
  () => props.items.length,
  async () => {
    await syncMediaPlayback()
  },
)

onMounted(() => {
  updateViewportHeight()
  window.addEventListener('resize', updateViewportHeight)
  window.addEventListener('keydown', onKeydown)
  void syncMediaPlayback()
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', updateViewportHeight)
  window.removeEventListener('keydown', onKeydown)
  pauseAndResetAllMedia()
})

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

function updateViewportHeight() {
  viewportHeight.value = stageRef.value?.clientHeight || window.innerHeight || 1
}

function canNavigate(direction: -1 | 1) {
  if (props.items.length === 0) {
    return false
  }

  const targetIndex = clamp(resolvedActiveIndex.value + direction, 0, props.items.length - 1)
  return targetIndex !== resolvedActiveIndex.value
}

function navigate(direction: -1 | 1) {
  if (props.items.length === 0) {
    return
  }

  const nextIndex = clamp(resolvedActiveIndex.value + direction, 0, props.items.length - 1)

  if (nextIndex !== resolvedActiveIndex.value) {
    emit('update:activeIndex', nextIndex)
  }
}

function applyEdgeResistance(deltaY: number) {
  const wantsPrevious = deltaY > 0
  const wantsNext = deltaY < 0

  if ((wantsPrevious && !canNavigate(-1)) || (wantsNext && !canNavigate(1))) {
    return deltaY * 0.24
  }

  return deltaY
}

function onPointerDown(event: PointerEvent) {
  if (
    props.items.length === 0
    || event.pointerType === 'mouse'
    || isInteractiveTarget(event.target)
  ) {
    return
  }

  activePointerId = event.pointerId
  dragStartY = event.clientY
  dragOffset.value = 0
  isDragging.value = true
  stageRef.value?.setPointerCapture?.(event.pointerId)
}

function onPointerMove(event: PointerEvent) {
  if (!isDragging.value || activePointerId !== event.pointerId) {
    return
  }

  const rawDelta = event.clientY - dragStartY
  dragOffset.value = applyEdgeResistance(rawDelta)
}

function onPointerUp(event: PointerEvent) {
  if (activePointerId !== event.pointerId) {
    return
  }

  stageRef.value?.releasePointerCapture?.(event.pointerId)
  finalizeDrag()
}

function onPointerCancel(event: PointerEvent) {
  if (activePointerId !== event.pointerId) {
    return
  }

  stageRef.value?.releasePointerCapture?.(event.pointerId)
  resetDragState()
}

function finalizeDrag() {
  const delta = dragOffset.value

  if (Math.abs(delta) >= dragThreshold.value) {
    navigate(delta < 0 ? 1 : -1)
  }

  resetDragState()
}

function resetDragState() {
  dragOffset.value = 0
  isDragging.value = false
  activePointerId = null
}

function onWheel(event: WheelEvent) {
  if (props.items.length === 0 || isDragging.value || isInteractiveTarget(event.target)) {
    return
  }

  if (Math.abs(event.deltaY) < Math.max(Math.abs(event.deltaX), 24)) {
    return
  }

  event.preventDefault()

  const now = Date.now()
  if (now < wheelLockedUntil) {
    return
  }

  wheelLockedUntil = now + 400
  navigate(event.deltaY > 0 ? 1 : -1)
}

function onKeydown(event: KeyboardEvent) {
  if (props.items.length === 0 || isEditableTarget(event.target)) {
    return
  }

  if (event.key === 'ArrowDown' || event.key === 'PageDown') {
    event.preventDefault()
    navigate(1)
  }

  if (event.key === 'ArrowUp' || event.key === 'PageUp') {
    event.preventDefault()
    navigate(-1)
  }
}

function isEditableTarget(target: EventTarget | null) {
  return target instanceof HTMLElement && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)
}

function isInteractiveTarget(target: EventTarget | null) {
  return target instanceof HTMLElement && Boolean(target.closest('audio, video, button, input, textarea, select, a'))
}

function registerVideoElement(id: string, element: unknown) {
  if (element instanceof HTMLVideoElement) {
    videoElements.set(id, element)
    return
  }

  videoElements.delete(id)
}

function registerAudioElement(id: string, element: unknown) {
  if (element instanceof HTMLAudioElement) {
    audioElements.set(id, element)
    return
  }

  audioElements.delete(id)
}

function pauseAndReset(media: HTMLMediaElement) {
  media.pause()

  try {
    media.currentTime = 0
  }
  catch {
    // Ignore reset failures for streams or not-yet-ready elements.
  }
}

function pauseAndResetAllMedia() {
  for (const media of videoElements.values()) {
    pauseAndReset(media)
  }

  for (const media of audioElements.values()) {
    pauseAndReset(media)
  }
}

async function syncMediaPlayback() {
  await nextTick()

  const activeId = activeItem.value?.id ?? null

  for (const [id, element] of videoElements.entries()) {
    if (id !== activeId) {
      pauseAndReset(element)
      continue
    }

    element.muted = true
    element.loop = true
    element.playsInline = true

    void element.play().catch(() => {
      // Autoplay can be blocked depending on the browser policy.
    })
  }

  for (const [id, element] of audioElements.entries()) {
    if (id !== activeId) {
      pauseAndReset(element)
      continue
    }

    void element.play().catch(() => {
      // Autoplay can be blocked depending on the browser policy.
    })
  }
}

function getTheme(type: VibeViewerType) {
  switch (type) {
    case 'image':
      return {
        start: '#120d08',
        glow: 'rgba(251, 191, 36, 0.4)',
        end: '#050507',
      }
    case 'video':
      return {
        start: '#07111c',
        glow: 'rgba(56, 189, 248, 0.38)',
        end: '#050608',
      }
    case 'audio':
      return {
        start: '#06120f',
        glow: 'rgba(16, 185, 129, 0.32)',
        end: '#040506',
      }
    case 'document':
      return {
        start: '#120817',
        glow: 'rgba(168, 85, 247, 0.34)',
        end: '#050507',
      }
    case 'archive':
      return {
        start: '#160809',
        glow: 'rgba(251, 113, 133, 0.32)',
        end: '#050507',
      }
    default:
      return {
        start: '#0d0c10',
        glow: 'rgba(148, 163, 184, 0.28)',
        end: '#040506',
      }
  }
}

function isVisual(item: VibeViewerItem) {
  return item.type === 'image' || item.type === 'video'
}

function isAudio(item: VibeViewerItem) {
  return item.type === 'audio'
}

function getImageSource(item: VibeViewerItem) {
  return item.original.url
}

function getItemLabel(type: VibeViewerType) {
  switch (type) {
    case 'image':
      return 'Image'
    case 'video':
      return 'Video'
    case 'audio':
      return 'Audio'
    case 'document':
      return 'Document'
    case 'archive':
      return 'Archive'
    default:
      return 'File'
  }
}

function getItemIcon(type: VibeViewerType) {
  switch (type) {
    case 'image':
      return ImagePlus
    case 'video':
      return Clapperboard
    case 'audio':
      return AudioLines
    case 'document':
      return FileText
    case 'archive':
      return FileArchive
    default:
      return File
  }
}

function formatFileSize(sizeBytes: number) {
  if (sizeBytes < 1024) {
    return `${sizeBytes} B`
  }

  const units = ['KB', 'MB', 'GB']
  let unitIndex = 0
  let size = sizeBytes / 1024

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024
    unitIndex += 1
  }

  return `${size.toFixed(size >= 10 ? 0 : 1)} ${units[unitIndex]}`
}

function formatDuration(durationMs: number | undefined) {
  if (!durationMs) {
    return 'n/a'
  }

  const totalSeconds = Math.round(durationMs / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value))
}

function getSlideTheme(item: VibeViewerItem) {
  return getTheme(item.type)
}
</script>

<template>
  <section
    ref="stageRef"
    class="vibe-root"
    @pointerdown="onPointerDown"
    @pointermove="onPointerMove"
    @pointerup="onPointerUp"
    @pointercancel="onPointerCancel"
    @wheel="onWheel"
  >
    <div
      class="vibe-root__wash"
      :style="{
        '--tone-start': stageTheme.start,
        '--tone-glow': stageTheme.glow,
        '--tone-end': stageTheme.end,
      }"
    />

    <div v-if="props.items.length > 0" class="vibe-root__track" :style="trackStyle">
      <article
        v-for="(item, index) in props.items"
        :key="item.id"
        class="vibe-root__slide"
        :class="{ 'is-active': index === resolvedActiveIndex }"
        :style="{
          '--slide-start': getSlideTheme(item).start,
          '--slide-glow': getSlideTheme(item).glow,
          '--slide-end': getSlideTheme(item).end,
        }"
      >
        <div class="vibe-root__slide-wash" />

        <div v-if="isVisual(item)" class="vibe-root__visual-stage">
          <img
            v-if="item.type === 'image'"
            class="vibe-root__image"
            :src="getImageSource(item)"
            :alt="item.title"
            draggable="false"
          />

          <video
            v-else
            class="vibe-root__video"
            playsinline
            muted
            loop
            preload="metadata"
            :ref="(element) => registerVideoElement(item.id, element)"
          >
            <source :src="item.original.url" :type="item.original.mimeType || item.mimeType" />
          </video>
        </div>

        <div v-else-if="isAudio(item)" class="vibe-root__audio-stage">
          <div class="vibe-root__audio-orbit vibe-root__audio-orbit--outer" />
          <div class="vibe-root__audio-orbit vibe-root__audio-orbit--inner" />
          <div class="vibe-root__file-chip vibe-root__file-chip--audio" aria-hidden="true">
            <component :is="getItemIcon(item.type)" class="vibe-root__file-chip-icon" />
          </div>

          <div class="vibe-root__audio-body">
            <p class="vibe-root__eyebrow">Audio item</p>
            <h2 class="vibe-root__audio-title">{{ item.title }}</h2>
            <p class="vibe-root__audio-meta">
              {{ item.extension.toUpperCase() }} · {{ formatDuration(item.durationMs) }} · {{ formatFileSize(item.sizeBytes) }}
            </p>
          </div>

          <audio
            controls
            preload="metadata"
            class="vibe-root__audio-player"
            :ref="(element) => registerAudioElement(item.id, element)"
          >
            <source :src="item.original.url" :type="item.original.mimeType || item.mimeType" />
          </audio>
        </div>

        <div v-else class="vibe-root__file-stage">
          <div class="vibe-root__file-chip" aria-hidden="true">
            <component :is="getItemIcon(item.type)" class="vibe-root__file-chip-icon" />
          </div>

          <div class="vibe-root__file-body">
            <p class="vibe-root__eyebrow">{{ getItemLabel(item.type) }}</p>
            <h2 class="vibe-root__file-title">{{ item.title }}</h2>
            <p class="vibe-root__file-copy">
              {{ item.mimeType }} · {{ item.extension.toUpperCase() }} · {{ formatFileSize(item.sizeBytes) }}
            </p>
          </div>
        </div>
      </article>
    </div>

    <div v-else class="vibe-root__empty">
      <p class="vibe-root__eyebrow">{{ props.loading ? 'Syncing' : 'Viewer ready' }}</p>
      <h2 class="vibe-root__empty-title">
        {{ props.loading ? 'Loading the viewer' : 'No items available' }}
      </h2>
      <p class="vibe-root__empty-copy">
        {{
          props.loading
            ? 'Pulling the first page from the fake server.'
            : 'Attach items to VibeRoot to turn this screen into the workspace.'
        }}
      </p>
    </div>

    <div v-if="activeItem" class="vibe-root__hud">
      <div class="vibe-root__hud-top">
        <span class="vibe-root__pill">
          <component :is="getItemIcon(activeItem.type)" class="vibe-root__pill-icon" aria-hidden="true" />
          {{ getItemLabel(activeItem.type) }}
        </span>
        <span class="vibe-root__counter">{{ resolvedActiveIndex + 1 }} / {{ props.items.length }}</span>
      </div>

      <div class="vibe-root__hud-bottom">
        <div class="vibe-root__hud-copy">
          <h2 class="vibe-root__hud-title">{{ activeItem.title }}</h2>
          <p class="vibe-root__hud-meta">
            {{ formatDate(activeItem.createdAt) }} · {{ activeItem.extension.toUpperCase() }} ·
            {{ formatFileSize(activeItem.sizeBytes) }}
          </p>
        </div>

        <div v-if="isAtEnd && !props.hasNextPage && !props.loading" class="vibe-root__hud-actions">
          <span class="vibe-root__hint vibe-root__hint--terminal">
            End reached
          </span>
        </div>
      </div>
    </div>

    <div v-if="statusMessage" class="vibe-root__status" :class="{ 'is-terminal': isAtEnd && !props.hasNextPage && !props.loading }">
      {{ statusMessage }}
    </div>
  </section>
</template>

<style scoped>
.vibe-root {
  position: relative;
  height: 100%;
  min-height: 100svh;
  overflow: hidden;
  background: #05060a;
  color: #f7f1ea;
  touch-action: none;
}

.vibe-root__wash {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at top center, var(--tone-glow) 0, transparent 42%),
    linear-gradient(180deg, var(--tone-start), var(--tone-end));
  transition: background 240ms ease;
}

.vibe-root__track {
  position: relative;
  z-index: 1;
  height: 100%;
  will-change: transform;
}

.vibe-root__slide {
  position: relative;
  display: flex;
  min-height: 100svh;
  align-items: center;
  justify-content: center;
}

.vibe-root__slide-wash {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at center, var(--slide-glow) 0, transparent 42%),
    linear-gradient(180deg, var(--slide-start), var(--slide-end));
  opacity: 0.85;
}

.vibe-root__audio-stage,
.vibe-root__file-stage,
.vibe-root__empty {
  position: relative;
  z-index: 1;
  width: min(100%, 1100px);
}

.vibe-root__visual-stage {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100svh;
  overflow: hidden;
}

.vibe-root__image,
.vibe-root__video {
  display: block;
  width: auto;
  height: auto;
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  box-shadow: 0 40px 120px -60px rgba(0, 0, 0, 0.9);
}

.vibe-root__audio-stage,
.vibe-root__file-stage,
.vibe-root__empty {
  display: grid;
  justify-items: center;
  gap: 1.5rem;
  text-align: center;
}

.vibe-root__audio-stage {
  padding: clamp(2rem, 4vw, 3rem);
}

.vibe-root__audio-orbit {
  position: absolute;
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.vibe-root__audio-orbit--outer {
  width: clamp(320px, 46vw, 560px);
  height: clamp(320px, 46vw, 560px);
  background: radial-gradient(circle, rgba(16, 185, 129, 0.16), transparent 66%);
}

.vibe-root__audio-orbit--inner {
  width: clamp(220px, 30vw, 360px);
  height: clamp(220px, 30vw, 360px);
  background: radial-gradient(circle, rgba(255, 255, 255, 0.08), transparent 62%);
}

.vibe-root__audio-body,
.vibe-root__file-body {
  position: relative;
  z-index: 1;
  display: grid;
  gap: 0.6rem;
  max-width: 38rem;
}

.vibe-root__file-stage {
  gap: 1.25rem;
  padding: clamp(2rem, 4vw, 3rem);
}

.vibe-root__file-chip {
  position: relative;
  z-index: 1;
  display: inline-flex;
  min-width: 4.25rem;
  min-height: 4.25rem;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(255, 255, 255, 0.18);
  background: rgba(255, 255, 255, 0.08);
  padding: 1rem;
  backdrop-filter: blur(20px);
}

.vibe-root__file-chip--audio {
  background: rgba(16, 185, 129, 0.12);
}

.vibe-root__file-chip-icon {
  width: 1.4rem;
  height: 1.4rem;
  stroke-width: 1.9;
}

.vibe-root__eyebrow {
  margin: 0;
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.28em;
  text-transform: uppercase;
  color: rgba(247, 241, 234, 0.68);
}

.vibe-root__audio-title,
.vibe-root__file-title,
.vibe-root__empty-title {
  margin: 0;
  font-size: clamp(2rem, 4.4vw, 3.6rem);
  line-height: 0.95;
  letter-spacing: -0.05em;
}

.vibe-root__audio-meta,
.vibe-root__file-copy,
.vibe-root__empty-copy {
  margin: 0;
  font-size: clamp(0.98rem, 1.3vw, 1.12rem);
  line-height: 1.8;
  color: rgba(247, 241, 234, 0.7);
}

.vibe-root__audio-player {
  position: relative;
  z-index: 1;
  width: min(100%, 34rem);
  opacity: 0.94;
}

.vibe-root__hud {
  pointer-events: none;
  position: absolute;
  inset: 0;
  z-index: 3;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: clamp(1.25rem, 2.6vw, 2.25rem);
}

.vibe-root__hud-top,
.vibe-root__hud-bottom {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}

.vibe-root__hud-bottom {
  align-items: flex-end;
}

.vibe-root__pill,
.vibe-root__counter,
.vibe-root__hint,
.vibe-root__status {
  display: inline-flex;
  align-items: center;
  border: 1px solid rgba(255, 255, 255, 0.14);
  background: rgba(4, 6, 10, 0.42);
  backdrop-filter: blur(18px);
}

.vibe-root__pill,
.vibe-root__counter,
.vibe-root__hint {
  padding: 0.7rem 1rem;
  font-size: 0.74rem;
  font-weight: 700;
  letter-spacing: 0.2em;
  text-transform: uppercase;
}

.vibe-root__pill {
  gap: 0.55rem;
}

.vibe-root__pill-icon {
  width: 0.9rem;
  height: 0.9rem;
  stroke-width: 2;
}

.vibe-root__counter,
.vibe-root__hint {
  color: rgba(247, 241, 234, 0.72);
}

.vibe-root__hint--terminal {
  border-color: rgba(251, 191, 36, 0.35);
  color: #fde68a;
}

.vibe-root__hud-copy {
  max-width: 34rem;
}

.vibe-root__hud-title {
  margin: 0;
  font-size: clamp(1.2rem, 2.4vw, 1.9rem);
  line-height: 1;
  letter-spacing: -0.05em;
}

.vibe-root__hud-meta {
  margin: 0.8rem 0 0;
  font-size: 0.95rem;
  line-height: 1.7;
  color: rgba(247, 241, 234, 0.7);
}

.vibe-root__hud-actions {
  display: grid;
  justify-items: end;
  gap: 0.5rem;
}

.vibe-root__status {
  position: absolute;
  left: 50%;
  bottom: 1.8rem;
  z-index: 4;
  transform: translateX(-50%);
  padding: 0.8rem 1.2rem;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: rgba(247, 241, 234, 0.74);
}

.vibe-root__status.is-terminal {
  border-color: rgba(251, 191, 36, 0.34);
  color: #fde68a;
}

@media (max-width: 720px) {
  .vibe-root__hud-top,
  .vibe-root__hud-bottom {
    flex-direction: column;
  }

  .vibe-root__hud-bottom {
    align-items: flex-start;
  }

  .vibe-root__hud-actions {
    justify-items: start;
  }

  .vibe-root__status {
    bottom: 1.3rem;
    width: calc(100% - 2.5rem);
    justify-content: center;
  }
}
</style>
