<script setup lang="ts">
import packageJson from '../package.json'

import VibeRoot from '@/components/VibeRoot.vue'
</script>

<template>
  <main class="min-h-screen px-6 py-10 text-stone-950 sm:px-8 lg:px-12">
    <div class="mx-auto flex min-h-[calc(100vh-5rem)] max-w-6xl items-center">
      <div class="grid w-full gap-10 lg:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)] lg:items-center">
        <section class="space-y-6">
          <p class="text-xs font-semibold uppercase tracking-[0.38em] text-stone-500">
            Vibe {{ packageJson.version }}
          </p>
          <div class="space-y-4">
            <h1 class="max-w-3xl text-5xl font-semibold tracking-tight sm:text-6xl">
              Blank workspace. Fresh repo. Start building the next Vibe.
            </h1>
            <p class="max-w-2xl text-lg leading-8 text-stone-600">
              This baseline keeps the package and library builds wired up while stripping the old product
              surface down to a clean Vue, Vite, TypeScript, and Tailwind starting point.
            </p>
          </div>

          <div class="flex flex-wrap gap-3 text-sm font-medium text-stone-700">
            <span class="rounded-full border border-stone-300 bg-white/70 px-4 py-2 backdrop-blur">Vue 3</span>
            <span class="rounded-full border border-stone-300 bg-white/70 px-4 py-2 backdrop-blur">Vite</span>
            <span class="rounded-full border border-stone-300 bg-white/70 px-4 py-2 backdrop-blur">TypeScript</span>
            <span class="rounded-full border border-stone-300 bg-white/70 px-4 py-2 backdrop-blur">Tailwind 4</span>
          </div>
        </section>

        <VibeRoot
          title="Component entry is live"
          subtitle="Edit src/components/VibeRoot.vue or replace it entirely as you rebuild the library."
        >
          <div class="space-y-4">
            <div class="rounded-2xl border border-white/70 bg-white/80 p-4">
              <p class="text-xs font-semibold uppercase tracking-[0.24em] text-stone-500">Start here</p>
              <p class="mt-2 text-sm leading-6 text-stone-600">
                The exported package surface is intentionally tiny. You have a clean component, plugin
                install, Tailwind-enabled demo, and working library build.
              </p>
            </div>

            <div class="grid gap-3 sm:grid-cols-2">
              <div class="rounded-2xl border border-black/8 bg-black/[0.03] p-4">
                <p class="text-xs font-semibold uppercase tracking-[0.24em] text-stone-500">Demo shell</p>
                <p class="mt-2 text-sm text-stone-700">`src/App.vue`</p>
              </div>
              <div class="rounded-2xl border border-black/8 bg-black/[0.03] p-4">
                <p class="text-xs font-semibold uppercase tracking-[0.24em] text-stone-500">Library entry</p>
                <p class="mt-2 text-sm text-stone-700">`src/index.ts`</p>
              </div>
            </div>
          </div>
        </VibeRoot>
      </div>
    </div>
  </main>
</template>
