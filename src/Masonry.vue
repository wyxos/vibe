<script setup>
import { computed, nextTick, onMounted, onUnmounted, ref, useAttrs, watch } from 'vue'

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
  itemWidth: {
    type: Number,
    default: 300,
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

const containerWidth = ref(0)
let resizeObserver

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
  if (typeof ResizeObserver !== 'undefined') {
    resizeObserver = new ResizeObserver(() => {
      const el = scrollContainerEl.value
      if (!el) return
      containerWidth.value = el.clientWidth
    })
  }

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

  await nextTick()
  const el = scrollContainerEl.value
  if (el) {
    containerWidth.value = el.clientWidth
    resizeObserver?.observe(el)
  }
})

onUnmounted(() => {
  resizeObserver?.disconnect()
})

watch(
  () => props.page,
  async (newPage) => {
    // If the starting page changes, restart the feed.
    pagesLoaded.value = []
    items.value = []
    nextPage.value = newPage
    isLoadingInitial.value = true
    isLoadingNext.value = false
    error.value = ''

    try {
      const result = await props.getContent(newPage)
      pagesLoaded.value = [newPage]
      items.value = result.items
      nextPage.value = result.nextPage
    } catch (err) {
      error.value = err instanceof Error ? err.message : String(err)
    } finally {
      isLoadingInitial.value = false
    }
  },
)

const columnCount = computed(() => {
  const width = containerWidth.value
  const target = props.itemWidth
  if (!width || width <= 0) return 1
  if (!target || target <= 0) return 1
  return Math.max(1, Math.floor(width / target))
})

const columnWidth = computed(() => {
  const count = columnCount.value
  const width = containerWidth.value
  if (!width || width <= 0) return props.itemWidth
  return width / count
})

function estimateItemHeight(item) {
  const w = item?.width
  const h = item?.height
  const colW = columnWidth.value
  if (typeof w === 'number' && typeof h === 'number' && w > 0 && h > 0) {
    return (h / w) * colW
  }
  return colW
}

const columns = computed(() => {
  const count = columnCount.value
  const list = Array.from({ length: count }, () => ({ height: 0, items: [] }))

  for (const item of items.value) {
    let bestIndex = 0
    for (let i = 1; i < list.length; i += 1) {
      if (list[i].height < list[bestIndex].height) bestIndex = i
    }

    list[bestIndex].items.push(item)
    list[bestIndex].height += estimateItemHeight(item)
  }

  return list.map((c) => c.items)
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

      <div v-else class="flex gap-4">
        <div
          v-for="(col, colIndex) in columns"
          :key="colIndex"
          class="flex min-w-0 flex-1 flex-col gap-4"
        >
          <article
            v-for="item in col"
            :key="item.id"
            data-testid="item-card"
            class="overflow-hidden rounded-xl border border-slate-200/60 bg-white shadow-sm"
          >
            <div class="bg-slate-100" :style="{ aspectRatio: item.width + ' / ' + item.height }">
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
      </div>

      <div class="mt-4 pb-2 text-center text-xs text-slate-600">
        <span v-if="isLoadingNext">Loading more…</span>
        <span v-else-if="nextPage == null">End of list</span>
        <span v-else>Scroll to load page {{ nextPage }}</span>
      </div>
    </div>
  </section>
</template>
