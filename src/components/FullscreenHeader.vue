<script setup lang="ts">
import { ArrowLeft } from 'lucide-vue-next'

const props = defineProps<{
  currentIndex: number
  paginationDetail?: string | null
  showBackToList?: boolean
  showEndBadge?: boolean
  title?: string | null
  total: number
}>()

const emit = defineEmits<{
  'back-to-list': []
}>()
</script>

<template>
  <div class="pointer-events-none absolute inset-0 z-[3] flex flex-col justify-between p-[clamp(1.25rem,2.6vw,2.25rem)]">
    <div class="grid gap-4">
      <div class="flex min-h-11 items-center justify-between gap-4">
        <div class="min-w-0 flex flex-1 items-center gap-3">
          <button
            v-if="props.showBackToList"
            type="button"
            data-testid="vibe-back-to-list"
            class="pointer-events-auto inline-flex h-11 w-11 shrink-0 items-center justify-center border border-white/14 bg-black/40 text-[#f7f1ea]/78 backdrop-blur-[18px] transition hover:border-white/28 hover:bg-black/55"
            aria-label="Back to list"
            @click="emit('back-to-list')"
          >
            <ArrowLeft class="h-4 w-4 stroke-[2.2]" aria-hidden="true" />
          </button>

          <h2
            v-if="props.title"
            data-testid="vibe-title"
            class="m-0 truncate text-left text-[0.82rem] leading-none tracking-[-0.04em] min-[721px]:text-[1.2rem]"
          >
            {{ props.title }}
          </h2>
        </div>

        <div class="pointer-events-auto flex shrink-0 items-center gap-2">
          <span
            data-testid="vibe-pagination"
            class="inline-flex shrink-0 items-center gap-2 whitespace-nowrap border border-white/14 bg-black/40 px-3 py-2 text-[0.63rem] font-bold uppercase tracking-[0.12em] text-[#f7f1ea]/72 backdrop-blur-[18px] min-[721px]:gap-3 min-[721px]:px-4 min-[721px]:py-3 min-[721px]:text-[0.74rem] min-[721px]:tracking-[0.2em]"
          >
            <span class="whitespace-nowrap">{{ props.currentIndex + 1 }} / {{ props.total }}</span>
            <span
              v-if="props.paginationDetail"
              class="whitespace-nowrap border-l border-white/12 pl-2 text-[#f7f1ea]/56 min-[721px]:pl-3"
            >
              {{ props.paginationDetail }}
            </span>
          </span>
          <slot name="actions" />
        </div>
      </div>
    </div>

    <div v-if="props.showEndBadge" class="grid gap-2 max-[720px]:justify-items-start">
      <span class="inline-flex items-center border border-amber-300/35 bg-black/40 px-4 py-3 text-[0.74rem] font-bold uppercase tracking-[0.2em] text-amber-200 backdrop-blur-[18px]">
        End reached
      </span>
    </div>
  </div>
</template>
