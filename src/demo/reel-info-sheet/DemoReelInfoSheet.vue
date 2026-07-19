<script setup lang="ts">
import { X } from 'lucide-vue-next'
import { computed, ref, useId } from 'vue'

import type { VibeReelInfoSheetProps } from '@/index'
import DemoSheetMasonryFeed from './DemoSheetMasonryFeed.vue'

const props = defineProps<VibeReelInfoSheetProps>()

const tabs = ['user', 'post'] as const
type DemoInfoTab = typeof tabs[number]

const activeTab = ref<DemoInfoTab>('user')
const tabGroupId = `reel-info-tabs-${useId()}`
const totalLabel = computed(() => props.total ?? props.loadedCount)

function tabId(tab: DemoInfoTab): string {
  return `${tabGroupId}-${tab}`
}

function panelId(tab: DemoInfoTab): string {
  return `${tabId(tab)}-panel`
}

function selectTab(tab: DemoInfoTab): void {
  activeTab.value = tab
}

function moveTab(event: KeyboardEvent, direction: -1 | 1): void {
  event.preventDefault()
  const current = tabs.indexOf(activeTab.value)
  const next = (current + direction + tabs.length) % tabs.length
  const tab = tabs[next]
  if (!tab) return

  activeTab.value = tab
  document.getElementById(tabId(tab))?.focus()
}
</script>

<template>
  <section
    class="demo-reel-info-sheet"
    :data-context-post-id="item.postId"
  >
    <header class="demo-info-sheet-header">
      <p class="demo-info-sheet-context">
        Post {{ index + 1 }} of {{ totalLabel }} · Media {{ mediaIndex + 1 }} of {{ mediaCount }}
      </p>
      <button
        class="demo-info-sheet-close"
        type="button"
        aria-label="Close reel information"
        @click="close"
      >
        <X :size="18" aria-hidden="true" />
      </button>
    </header>

    <div class="demo-info-sheet-tabs" role="tablist" aria-label="Reel information">
      <button
        v-for="tab in tabs"
        :id="tabId(tab)"
        :key="tab"
        class="demo-info-sheet-tab"
        :class="{ 'demo-info-sheet-tab--active': activeTab === tab }"
        type="button"
        role="tab"
        :aria-controls="panelId(tab)"
        :aria-selected="activeTab === tab"
        :tabindex="activeTab === tab ? 0 : -1"
        @click="selectTab(tab)"
        @keydown.left="moveTab($event, -1)"
        @keydown.right="moveTab($event, 1)"
      >
        {{ tab === 'user' ? 'User' : 'Post' }}
      </button>
    </div>

    <Transition name="demo-info-tab" mode="out-in">
      <div
        :id="panelId(activeTab)"
        :key="`${activeTab}:${item.postId}`"
        class="demo-info-sheet-panel"
        role="tabpanel"
        :aria-labelledby="tabId(activeTab)"
      >
        <DemoSheetMasonryFeed
          :item="item"
          :mode="activeTab"
        />
      </div>
    </Transition>
  </section>
</template>
