<script setup lang="ts">
import {
  computed,
  onBeforeUnmount,
  onMounted,
  shallowRef,
  watch,
} from 'vue'

import { getFakeMediaPage } from '@/demo/fakeServer'
import DemoRemovalFooter from '@/demo/item-removal/DemoRemovalFooter.vue'
import {
  createVibe,
  type VibeInstance,
  type VibeItemId,
  type VibeItemPlacement,
  type VibeState,
} from '@/index'

const props = defineProps<{
  infiniteScroll: boolean
}>()

const emit = defineEmits<{
  vibeStateChange: [state: VibeState]
}>()

const vibeTarget = shallowRef<HTMLElement | null>(null)
const vibeState = shallowRef<VibeState | null>(null)
const recentRemoval = shallowRef<readonly VibeItemPlacement[]>([])
const removalStatus = shallowRef('Ready to remove items')
const isRemoving = shallowRef(false)
const randomRemovalCount = computed(() => (
  Math.min(3, vibeState.value?.items.length ?? 0)
))
const canRemoveMultiple = computed(() => (
  !isRemoving.value && randomRemovalCount.value >= 2
))
let vibe: VibeInstance | null = null

watch(() => props.infiniteScroll, (enabled) => {
  vibe?.setInfiniteScroll(enabled)
})

function visiblePostIds(): VibeItemId[] {
  const state = vibeState.value
  const target = vibeTarget.value
  if (!state || !target) return []

  const selector = state.layout === 'masonry' ? '.masonry-item' : '.reel-item'
  const visibleIds = new Set(
    [...target.querySelectorAll<HTMLElement>(selector)]
      .map((element) => element.dataset.postId)
      .filter((postId): postId is string => postId !== undefined),
  )
  return state.items
    .filter((item) => visibleIds.has(String(item.postId)))
    .map((item) => item.postId)
}

function randomPostIds(count: number): VibeItemId[] {
  const items = vibeState.value?.items ?? []
  const candidates = visiblePostIds()
  const available = candidates.length >= count
    ? candidates
    : items.map((item) => item.postId)

  for (let index = available.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1))
    ;[available[index], available[randomIndex]] = [
      available[randomIndex]!,
      available[index]!,
    ]
  }
  return available.slice(0, count)
}

async function removeItems(postIds: readonly VibeItemId[]): Promise<void> {
  if (!vibe || isRemoving.value) return

  isRemoving.value = true
  try {
    const removed = await vibe.removeItems(postIds)
    if (removed.length === 0) return

    recentRemoval.value = removed
    removalStatus.value = `Removed ${removed.length} item${removed.length === 1 ? '' : 's'}`
  } finally {
    isRemoving.value = false
  }
}

function removeRandomItems(): void {
  const count = randomRemovalCount.value
  if (count >= 2) void removeItems(randomPostIds(count))
}

function removeCardItem(event: Event): void {
  void removeItems([(event as CustomEvent<VibeItemId>).detail])
}

function undoRemoval(): void {
  if (!vibe || recentRemoval.value.length === 0 || isRemoving.value) return

  const placements = recentRemoval.value
  vibe.restoreItems(placements)
  recentRemoval.value = []
  removalStatus.value = `Restored ${placements.length} item${placements.length === 1 ? '' : 's'}`
}

onMounted(async () => {
  const target = vibeTarget.value
  if (!target) return

  vibe = createVibe({
    cardFooter: {
      component: DemoRemovalFooter,
      height: 48,
    },
    target,
    layout: 'responsive',
    infiniteScroll: props.infiniteScroll,
    mediaCard: { feedPreload: 'visible-post' },
    onStateChange: (state) => {
      vibeState.value = state
      emit('vibeStateChange', state)
    },
    loadPage: async ({ cursor }) => {
      const page = await getFakeMediaPage(cursor)

      return {
        items: page.items,
        next: page.meta.next,
        total: page.meta.total,
      }
    },
  })

  await vibe.mount()
})

onBeforeUnmount(() => {
  vibe?.destroy()
  vibe = null
})
</script>

<template>
  <section
    class="demo-stage item-removal-demo-stage"
    aria-label="Item removal"
  >
    <div class="item-removal-demo-controls">
      <p>Remove cards individually or in a random set, then restore the latest removal.</p>
      <div class="item-removal-demo-actions">
        <span
          class="item-removal-demo-status"
          role="status"
          data-test="removal-status"
        >
          {{ removalStatus }}
        </span>
        <button
          type="button"
          class="item-removal-demo-action item-removal-demo-action--remove"
          :disabled="!canRemoveMultiple"
          data-test="remove-random-items"
          @click="removeRandomItems"
        >
          Remove {{ randomRemovalCount }} at random
        </button>
        <button
          type="button"
          class="item-removal-demo-action"
          :disabled="recentRemoval.length === 0 || isRemoving"
          data-test="undo-removal"
          @click="undoRemoval"
        >
          Undo removal
        </button>
      </div>
    </div>
    <div
      ref="vibeTarget"
      class="vibe-host demo-vibe-host"
      aria-label="Item removal demo"
      @vibe-demo-remove-item="removeCardItem"
    />
  </section>
</template>
