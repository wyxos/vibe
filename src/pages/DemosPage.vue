<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'

import type { VibeInstance, VibeState } from '@/index'

defineProps<{
  infiniteScroll: boolean
}>()

const emit = defineEmits<{
  vibeInstanceChange: [instance: VibeInstance | null]
  vibeStateChange: [state: VibeState]
}>()
</script>

<template>
  <main class="demos-page">
    <aside class="demos-aside" aria-label="Demos">
      <RouterLink
        class="demos-aside-link"
        to="/demos/auto-scroll"
      >
        Auto scroll
      </RouterLink>
      <RouterLink
        class="demos-aside-link"
        to="/demos/reel-auto-advance"
      >
        Reel auto advance
      </RouterLink>
      <RouterLink
        class="demos-aside-link"
        to="/demos/reel-info-sheet"
      >
        Reel info sheet
      </RouterLink>
      <RouterLink
        class="demos-aside-link"
        to="/demos/card-header-and-footer"
      >
        Card header &amp; footer
      </RouterLink>
      <RouterLink
        class="demos-aside-link"
        to="/demos/reel-url"
      >
        Reel URL
      </RouterLink>
      <RouterLink
        class="demos-aside-link"
        to="/demos/autofill/frontend"
      >
        Frontend autofill
      </RouterLink>
      <RouterLink
        class="demos-aside-link"
        to="/demos/autofill/backend"
      >
        Backend autofill
      </RouterLink>
      <RouterLink
        class="demos-aside-link"
        to="/demos/autofill/backend-refresh"
      >
        Backend refresh
      </RouterLink>
      <RouterLink
        class="demos-aside-link"
        to="/demos/fill/frontend"
      >
        Frontend fill
      </RouterLink>
      <RouterLink
        class="demos-aside-link"
        to="/demos/fill/backend"
      >
        Backend fill
      </RouterLink>
    </aside>

    <RouterView v-slot="{ Component }">
      <component
        :is="Component"
        :infinite-scroll="infiniteScroll"
        @vibe-instance-change="emit('vibeInstanceChange', $event)"
        @vibe-state-change="emit('vibeStateChange', $event)"
      />
    </RouterView>
  </main>
</template>
