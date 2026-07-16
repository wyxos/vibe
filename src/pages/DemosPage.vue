<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'

import type { VibeState } from '@/index'

defineProps<{
  infiniteScroll: boolean
}>()

const emit = defineEmits<{
  vibeStateChange: [state: VibeState]
}>()
</script>

<template>
  <main class="demos-page">
    <aside class="demos-aside" aria-label="Demos">
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
    </aside>

    <RouterView v-slot="{ Component }">
      <component
        :is="Component"
        :infinite-scroll="infiniteScroll"
        @vibe-state-change="emit('vibeStateChange', $event)"
      />
    </RouterView>
  </main>
</template>
