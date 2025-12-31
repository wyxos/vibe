<script setup>
import { computed, onMounted, ref, useAttrs } from 'vue'

defineOptions({ inheritAttrs: false })

const props = defineProps({
  getContent: {
    type: Function,
    required: true,
  },
  page: {
    type: [String, Number],
    default: 1,
  },
  prefetchThresholdPx: {
    type: Number,
    default: 200,
  },
})

const attrs = useAttrs()

const passthroughAttrs = computed(() => {
  // Avoid double-applying class by stripping it from v-bind.
  const { class: _class, ...rest } = attrs
  return rest
})

const scrollContainerEl = ref(null)

const isLoadingInitial = ref(true)
const isLoadingNext = ref(false)
const error = ref('')

const pagesLoaded = ref([])
const items = ref([])
const nextPage = ref(props.page)

const firstLoadedPageToken = computed(() => {
  return pagesLoaded.value.length ? pagesLoaded.value[0] : props.page
})

async function loadNextPage() {
  if (isLoadingInitial.value || isLoadingNext.value) return
  if (nextPage.value == null) return

  try {
    isLoadingNext.value = true
    error.value = ''

    const pageToLoad = nextPage.value
    const result = await props.getContent(pageToLoad)

    pagesLoaded.value = [...pagesLoaded.value, pageToLoad]
    items.value = [...items.value, ...result.items]
    nextPage.value = result.nextPage
  } catch (err) {
    error.value = err instanceof Error ? err.message : String(err)
  } finally {
    isLoadingNext.value = false
  }
}

function maybeLoadMoreOnScroll() {
  const el = scrollContainerEl.value
  if (!el) return

  const distanceFromBottom = el.scrollHeight - (el.scrollTop + el.clientHeight)
  if (distanceFromBottom <= props.prefetchThresholdPx) {
    void loadNextPage()
  }
}

onMounted(async () => {
  // Seed initial load
  nextPage.value = props.page

  try {
    isLoadingInitial.value = true
    error.value = ''

    const result = await props.getContent(props.page)

    pagesLoaded.value = [props.page]
    items.value = result.items
    nextPage.value = result.nextPage
  } catch (err) {
    error.value = err instanceof Error ? err.message : String(err)
  } finally {
    isLoadingInitial.value = false
  }
})

const sectionClass = computed(() => {
  const userClass = attrs.class
  return [
    'mt-8 flex min-h-0 flex-1 flex-col rounded-2xl border border-slate-200/70 bg-white/70 p-5 shadow-sm backdrop-blur',
    userClass,
  ]
})
</script>

<template>
  <section v-bind="passthroughAttrs" :class="sectionClass">
    <div class="flex items-baseline justify-between gap-4">
      <h2 class="text-base font-medium text-slate-900">Page {{ firstLoadedPageToken }}</h2>
      <p class="text-xs text-slate-600">Pages loaded: {{ pagesLoaded.length }}</p>
    </div>

    <div
      ref="scrollContainerEl"
      data-testid="items-scroll-container"
      class="mt-4 min-h-0 flex-1 overflow-auto"
      @scroll="maybeLoadMoreOnScroll"
    >
      <p v-if="isLoadingInitial" class="text-sm text-slate-600">Loading…</p>
      <p v-else-if="error" class="text-sm font-medium text-red-700">Error: {{ error }}</p>

      <div v-else class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <article
          v-for="item in items"
          :key="item.id"
          data-testid="item-card"
          class="overflow-hidden rounded-xl border border-slate-200/60 bg-white shadow-sm"
        >
          <div class="aspect-[4/3] bg-slate-100">
            <img
              v-if="item.type === 'image'"
              class="h-full w-full object-cover"
              :src="item.preview"
              :width="item.width"
              :height="item.height"
              loading="lazy"
              :alt="item.id"
            />

            <video
              v-else
              class="h-full w-full object-cover"
              :poster="item.preview"
              controls
              preload="metadata"
            >
              <source :src="item.original" type="video/mp4" />
            </video>
          </div>

          <div class="flex items-center justify-between gap-3 px-4 py-3">
            <span
              class="inline-flex items-center rounded-full bg-gradient-to-r from-blue-500/10 to-cyan-500/10 px-2 py-0.5 text-xs font-medium text-slate-700"
            >
              {{ item.type }}
            </span>
            <span class="truncate font-mono text-xs text-slate-500">{{ item.id }}</span>
          </div>
        </article>
      </div>

      <div class="mt-4 pb-2 text-center text-xs text-slate-600">
        <span v-if="isLoadingNext">Loading more…</span>
        <span v-else-if="nextPage == null">End of list</span>
        <span v-else>Scroll to load page {{ nextPage }}</span>
      </div>
    </div>
  </section>
</template>
