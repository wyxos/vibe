<script setup lang="ts">
import packageJson from '../package.json'
import { computed } from 'vue'
import { RouterLink, RouterView, useRoute } from 'vue-router'

const route = useRoute()

const isImmersiveRoute = computed(() => route.meta.immersive === true)
</script>

<template>
  <main
    class="[font-family:'Segoe_UI_Variable','Segoe_UI',sans-serif] text-stone-950"
    :class="isImmersiveRoute
      ? 'h-screen overflow-hidden bg-[#05060a]'
      : 'min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(245,158,11,0.24),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(14,165,233,0.2),transparent_32%),#f6efe6] px-6 py-10 sm:px-8 lg:px-12'"
  >
    <RouterView v-if="isImmersiveRoute" />

    <div v-else class="mx-auto max-w-6xl space-y-8">
      <header class="flex flex-col gap-4 border border-white/70 bg-white/65 px-5 py-5 shadow-[0_30px_90px_-48px_rgba(31,26,22,0.45)] backdrop-blur sm:px-6">
        <div class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div class="space-y-2">
            <p class="text-xs font-semibold uppercase tracking-[0.38em] text-stone-500">
              Vibe {{ packageJson.version }}
            </p>
            <h1 class="text-3xl font-semibold tracking-tight text-stone-950 sm:text-4xl">
              Blank workspace with routed demos
            </h1>
          </div>

          <nav class="flex flex-wrap gap-2 text-sm font-medium" aria-label="Primary">
            <RouterLink
              to="/debug/fake-server"
              class="border px-4 py-2 transition"
              active-class="border-stone-900 bg-stone-900 text-white"
            >
              Fake Server Debug
            </RouterLink>
          </nav>
        </div>
      </header>

      <RouterView />
    </div>
  </main>
</template>
