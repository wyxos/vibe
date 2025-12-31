<script setup lang="ts">
import pkg from '../package.json'
import { RouterLink, RouterView } from 'vue-router'

const githubUrl = 'https://github.com/wyxos/vibe'
const npmUrl = `https://www.npmjs.com/package/${encodeURIComponent(pkg.name)}`
</script>

<template>
  <div class="flex h-full min-h-0 flex-col">
    <header class="border-b border-slate-200 bg-white">
      <div
        class="mx-auto flex max-w-7xl items-center gap-3 px-6 py-3 2xl:max-w-screen-2xl 2xl:px-10 min-[1920px]:!max-w-[1800px] min-[1920px]:!px-12 min-[2560px]:!max-w-[2200px]"
      >
        <RouterLink to="/" class="inline-flex items-center gap-2">
          <img src="/logo.svg" alt="Vibe" class="h-7 w-7" />
          <span class="text-sm font-semibold tracking-tight text-slate-900">Vibe</span>
        </RouterLink>

        <nav class="flex items-center gap-2" aria-label="Primary">
          <details class="relative">
            <summary
              class="inline-flex cursor-pointer list-none items-center justify-center rounded-md px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Examples
              <i class="fa-solid fa-chevron-down ml-2 text-xs" aria-hidden="true" />
            </summary>

            <div class="absolute left-0 z-10 mt-2 w-48 rounded-md border border-slate-200 bg-white p-1">
              <RouterLink
                to="/examples/backfill"
                class="flex items-center rounded-md px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                active-class="bg-slate-100 text-slate-900"
              >
                Backfill
              </RouterLink>
            </div>
          </details>
        </nav>

        <div class="ml-auto flex items-center gap-2">
          <a
            :href="githubUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="inline-flex items-center justify-center rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <i class="fa-brands fa-github" aria-hidden="true" />
            <span class="sr-only">GitHub</span>
          </a>
          <a
            :href="npmUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="inline-flex items-center justify-center rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            npm
          </a>
        </div>
      </div>
    </header>

    <main class="min-h-0 flex-1">
      <RouterView />
    </main>
  </div>
</template>
