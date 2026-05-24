<script setup lang="ts">
import { LoaderCircle, X } from 'lucide-vue-next'

const props = defineProps<{
  currentIndex: number
  loading?: boolean
  paginationDetail?: string | null
  showBackToList?: boolean
  title?: string | null
  total: number
}>()

const emit = defineEmits<{
  'back-to-list': []
}>()
</script>

<template>
  <header
    data-testid="vibe-fullscreen-header"
    class="relative z-[3] shrink-0 border-b border-white/10 bg-[#05060a] px-3 py-2"
  >
    <div class="flex min-h-8 flex-wrap items-center justify-between gap-2">
      <div class="min-w-0 flex flex-1 items-center gap-2">
        <button
          v-if="props.showBackToList"
          type="button"
          data-testid="vibe-back-to-list"
          class="inline-flex h-8 w-8 shrink-0 items-center justify-center border border-white/12 bg-black/20 text-[#f7f1ea]/74 transition hover:border-white/24 hover:bg-white/6 hover:text-[#f7f1ea]"
          aria-label="Exit viewer"
          title="Exit viewer"
          @click="emit('back-to-list')"
        >
          <X class="h-3.5 w-3.5 stroke-[2.2]" aria-hidden="true" />
        </button>

        <h2
          v-if="props.title"
          data-testid="vibe-title"
          class="m-0 min-w-0 truncate text-left text-[0.82rem] leading-none text-[#f7f1ea]/88 min-[721px]:text-[0.92rem]"
        >
          {{ props.title }}
        </h2>
      </div>

      <div class="flex min-w-0 flex-wrap items-center justify-end gap-2">
        <span
          data-testid="vibe-pagination"
          class="inline-flex h-8 shrink-0 items-center gap-2 whitespace-nowrap border border-white/12 bg-black/20 px-2.5 text-[0.68rem] font-semibold uppercase tracking-[0.1em] text-[#f7f1ea]/70"
        >
          <LoaderCircle
            v-if="props.loading"
            data-testid="vibe-pagination-spinner"
            class="h-3.5 w-3.5 animate-spin stroke-[1.9]"
            aria-hidden="true"
          />
          <span class="whitespace-nowrap">{{ props.currentIndex + 1 }} / {{ props.total }}</span>
          <span
            v-if="props.paginationDetail"
            class="whitespace-nowrap border-l border-white/12 pl-2 text-[#f7f1ea]/56"
          >
            {{ props.paginationDetail }}
          </span>
        </span>
        <slot name="actions" />
      </div>
    </div>
  </header>
</template>
