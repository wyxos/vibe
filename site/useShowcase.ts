import { computed, defineComponent, h, nextTick, onBeforeUnmount, onMounted, ref, shallowRef } from 'vue'
import type { PropType, Ref } from 'vue'
import { createVibe } from '../src/index'
import type { VibeInstance, VibeItem, VibePage, VibeReelPreviewPlacement, VibeReelPreviewTransition, VibeState } from '../src/index'
import { getShowcaseItems } from './fixtures'
import type { ShowcaseItem } from './fixtures'
import ShowcaseCardFooter from './components/ShowcaseCardFooter.vue'
import ShowcaseInfoSheet from './components/ShowcaseInfoSheet.vue'

export type ShowcaseFilter = 'all' | 'image' | 'video' | 'audio'
const pageSize = 18

function latency(milliseconds: number, signal: AbortSignal): Promise<void> {
  // This one-shot delay demonstrates an asynchronous page boundary. It never
  // polls: loading starts only from Vibe's scroll/user events and aborts on reset.
  return new Promise((resolve, reject) => {
    if (signal.aborted) { reject(new DOMException('Canceled', 'AbortError')); return }
    const abort = () => { clearTimeout(timer); reject(new DOMException('Canceled', 'AbortError')) }
    const timer = setTimeout(() => { signal.removeEventListener('abort', abort); resolve() }, milliseconds)
    signal.addEventListener('abort', abort, { once: true })
  })
}

function fixturePage(page: number, filter: ShowcaseFilter): VibePage {
  const catalog = getShowcaseItems(filter)
  return {
    current: page,
    next: page + 1,
    items: Array.from({ length: pageSize }, (_, offset) => {
      const index = page * pageSize + offset
      const item = catalog[index % catalog.length]!
      const suffix = `${filter}-${index}`
      return {
        ...item,
        postId: `${item.postId}-${suffix}`,
        mediaId: `${item.mediaId}-${suffix}`,
        items: item.items.map((child, childIndex) => ({
          ...child, mediaId: `${child.mediaId}-${suffix}-${childIndex}`,
        })),
      }
    }),
  }
}

export function useShowcase(target: Ref<HTMLElement | null>) {
  const filter = ref<ShowcaseFilter>('all')
  const state = shallowRef<VibeState | null>(null)
  const rendered = ref(0)
  const reelTarget = shallowRef<HTMLElement | null>(null)
  const filtering = ref(false)
  const error = ref('')
  let vibe: VibeInstance | null = null
  let observer: MutationObserver | null = null
  let viewport: MediaQueryList | null = null
  let request: AbortController | null = null
  let generation = 0
  let viewportFill = 0
  let sizeObserver: ResizeObserver | null = null

  const loaded = computed(() => state.value?.items.length ?? 0)
  const reelPreviews = computed(() => state.value?.reelPreviews ?? false)
  const previewPlacement = ref<VibeReelPreviewPlacement>('right')
  const previewCount = ref(4)
  const previewTransition = ref<VibeReelPreviewTransition>('slide')
  const layout = computed(() => state.value?.reelOrigin === 'masonry' ? 'reel' : 'masonry')
  const busy = computed(() => filtering.value || !state.value || state.value.isLoading || state.value.isLoadingMore)
  const status = computed(() => filtering.value ? 'Changing collection'
    : state.value?.isLoading ? 'Loading the first page'
      : state.value?.isLoadingMore ? 'Bringing in the next page'
        : state.value?.lifecycle === 'error' ? 'Feed unavailable' : 'Ready to explore')

  function closeReel() { vibe?.closeReel() }
  function toggleReelPreviews() { vibe?.setReelPreviews(!reelPreviews.value) }

  function countRendered() {
    reelTarget.value = target.value?.querySelector<HTMLElement>('.vibe-reel-overlay') ?? null
    rendered.value = target.value?.querySelectorAll('.masonry-item, .reel-shell').length ?? 0
  }

  async function fillViewport(api: VibeInstance) {
    const current = ++viewportFill
    // Each iteration requests a real page, then lets the browser commit its
    // geometry. This bounded startup fill never polls or scrolls for the user.
    for (let pages = 0; pages < 6; pages++) {
      await nextTick()
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
      if (current !== viewportFill || vibe !== api || filtering.value) return
      const feed = target.value?.querySelector<HTMLElement>('.masonry-feed')
      const snapshot = api.getState()
      if (!feed || feed.clientHeight === 0 || feed.scrollHeight > feed.clientHeight + 1
        || snapshot.next === null || snapshot.nextPageError || snapshot.isLoading
        || snapshot.isLoadingMore || snapshot.loadMoreLocked) return
      await api.loadNext()
      if (api.getState().items.length <= snapshot.items.length) return
    }
  }

  async function showInfo(item: ShowcaseItem) {
    vibe?.openReel(item.postId)
    await nextTick()
    if (item.mediaId === undefined) return
    vibe?.navigateToReelItem({ postId: item.postId, mediaId: item.mediaId })
    vibe?.setReelInfoSheet(true)
  }

  const CardFooter = defineComponent({
    inheritAttrs: false,
    props: { item: { type: Object as PropType<VibeItem>, required: true }, mediaCount: Number },
    setup: (props) => () => h(ShowcaseCardFooter, {
      item: props.item as ShowcaseItem,
      mediaCount: props.mediaCount ?? 1,
      onInfo: () => { void showInfo(props.item as ShowcaseItem) },
    }),
  })

  async function initialize(initialPage?: VibePage, scrollTop = 0) {
    const element = target.value
    if (!element) return
    const current = ++generation
    const selectedIds = vibe?.getSelection().selectedIds ?? []
    vibe?.destroy()
    const api = createVibe({
      target: element, layout: 'masonry', infiniteScroll: true, initialPage,
      selection: {
        initialIds: selectedIds,
        getLabel: (item) => (item as ShowcaseItem).title,
        actions: [{ id: 'copy-selection', label: 'Copy selected IDs',
          run: async (ids) => { await navigator.clipboard.writeText(ids.map(String).join('\n')) } }],
      },
      // The public demo arranges its current session only; it has no saved collection service.
      ordering: { onReorder: () => {}, collectionKey: () => filter.value },
      reelPreviews: reelPreviews.value,
      reelPreviewPlacement: () => previewPlacement.value,
      reelPreviewCount: () => previewCount.value,
      reelPreviewTransition: () => previewTransition.value,
      cardFooter: { component: CardFooter, height: 56 },
      reelInfoSheet: { component: ShowcaseInfoSheet },
      mediaCard: { feedPreload: 'visible-post',
        pauseVideoDuringTransitions: true },
      masonry: { minColumnWidth: viewport?.matches ? 145 : 240, loadMoreThresholdPx: 420,
        overscan: { minimumPx: 350, viewportMultiplier: 0.75, maximumPx: 650 } },
      onStateChange: (value) => { if (generation === current) state.value = value },
      loadPage: async ({ cursor, signal }) => {
        const snapshot = filter.value
        const page = typeof cursor === 'number' ? cursor : 0
        await latency(page === 0 ? 180 : 450, signal)
        return fixturePage(page, snapshot)
      },
    })
    vibe = api
    await api.mount()
    if (generation !== current) return
    await nextTick()
    const scroller = element.querySelector('.masonry-feed')
    if (scroller && scrollTop) scroller.scrollTop = scrollTop
    countRendered()
    await fillViewport(api)
  }

  async function chooseFilter(value: ShowcaseFilter) {
    if (value === filter.value && !filtering.value) return
    viewportFill++
    request?.abort()
    const controller = new AbortController()
    request = controller
    filter.value = value
    filtering.value = true
    error.value = ''
    const api = vibe
    try {
      await api?.cancelLoading()
      api?.setAutoScroll(false)
      api?.setReelInfoSheet(false)
      api?.setLoadMoreLocked(true)
      await latency(180, controller.signal)
      if (request !== controller || controller.signal.aborted) return
      await api?.replacePage(fixturePage(0, value), { resetScroll: true, prepareMedia: true })
      api?.clearSelection()
    } catch {
      if (!controller.signal.aborted) error.value = 'The collection could not change. Please try again.'
    } finally {
      if (request === controller) {
        filtering.value = false
        api?.setLoadMoreLocked(false)
        request = null
        if (api && !controller.signal.aborted) await fillViewport(api)
      }
    }
  }

  async function reset() {
    viewportFill++
    request?.abort()
    request = null
    filtering.value = false
    error.value = ''
    vibe?.setAutoScroll(false)
    vibe?.setLoadMoreLocked(false)
    vibe?.setReelInfoSheet(false)
    try {
      if (vibe) { await vibe.reload(); await fillViewport(vibe) }
      else await initialize()
    } catch {
      error.value = 'The demo could not restart. Please try again.'
    }
  }

  function resize() {
    const snapshot = state.value
    const page = !filtering.value && snapshot?.items.length ? {
      items: [...snapshot.items], current: snapshot.current, next: snapshot.next,
    } : undefined
    const top = target.value?.querySelector('.masonry-feed')?.scrollTop ?? 0
    request?.abort()
    filtering.value = false
    void initialize(page, top).catch(() => { error.value = 'The feed could not resize. Restart the demo to try again.' })
  }

  onMounted(() => {
    viewport = window.matchMedia('(max-width: 600px)')
    viewport.addEventListener('change', resize)
    sizeObserver = new ResizeObserver(() => { if (vibe) void fillViewport(vibe) })
    if (target.value) sizeObserver.observe(target.value)
    observer = new MutationObserver(countRendered)
    if (target.value) observer.observe(target.value, { childList: true, subtree: true })
    void initialize().catch(() => { error.value = 'The demo could not start. Restart it to try again.' })
  })
  onBeforeUnmount(() => {
    generation++
    viewportFill++
    request?.abort()
    observer?.disconnect()
    sizeObserver?.disconnect()
    viewport?.removeEventListener('change', resize)
    vibe?.destroy()
    vibe = null
  })

  return { filter, layout, loaded, rendered, busy, status, error, reelTarget, reelPreviews, previewPlacement, previewCount, previewTransition,
    chooseFilter, closeReel, reset, toggleReelPreviews }
}
