import { computed, defineComponent, h, nextTick, onBeforeUnmount, onMounted, ref, shallowRef } from 'vue'
import type { PropType, Ref } from 'vue'
import { createVibe } from '../src/index'
import type { VibeInstance, VibeItem, VibePage, VibeState } from '../src/index'
import { getShowcaseItems } from './fixtures'
import type { ShowcaseItem } from './fixtures'
import ShowcaseCardFooter from './components/ShowcaseCardFooter.vue'
import ShowcaseInfoSheet from './components/ShowcaseInfoSheet.vue'
import { attachReelEntryReveal } from './reelEntryReveal'

export type ShowcaseFilter = 'all' | 'image' | 'video' | 'audio'
type ShowcaseLayout = 'masonry' | 'reel'
const pageSize = 12

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
  const layout = ref<ShowcaseLayout>('masonry')
  const state = shallowRef<VibeState | null>(null)
  const rendered = ref(0)
  const filtering = ref(false)
  const error = ref('')
  let vibe: VibeInstance | null = null
  let observer: MutationObserver | null = null
  let stopReelReveal: (() => void) | undefined
  let viewport: MediaQueryList | null = null
  let request: AbortController | null = null
  let generation = 0

  const loaded = computed(() => state.value?.items.length ?? 0)
  const autoScrolling = computed(() => Boolean(state.value?.autoScroll.enabled))
  const busy = computed(() => filtering.value || !state.value || state.value.isLoading || state.value.isLoadingMore)
  const status = computed(() => filtering.value ? 'Changing collection'
    : state.value?.isLoading ? 'Loading the first page'
      : state.value?.isLoadingMore ? 'Bringing in the next page'
        : state.value?.lifecycle === 'error' ? 'Feed unavailable' : 'Ready to explore')

  function countRendered() {
    rendered.value = target.value?.querySelectorAll('.masonry-item, .reel-shell').length ?? 0
  }

  async function showInfo(item: ShowcaseItem) {
    layout.value = 'reel'
    vibe?.setLayout('reel')
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
    vibe?.destroy()
    const api = createVibe({
      target: element, layout: layout.value, infiniteScroll: true, initialPage,
      cardFooter: { component: CardFooter, height: 56 },
      reelInfoSheet: { component: ShowcaseInfoSheet },
      mediaCard: { feedPreload: 'visible-post', videoMuted: true },
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
  }

  async function chooseFilter(value: ShowcaseFilter) {
    if (value === filter.value && !filtering.value) return
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
      await api?.replacePage(fixturePage(0, value), { resetScroll: true })
    } catch {
      if (!controller.signal.aborted) error.value = 'The collection could not change. Please try again.'
    } finally {
      if (request === controller) {
        filtering.value = false
        api?.setLoadMoreLocked(false)
        request = null
      }
    }
  }

  function chooseLayout(value: ShowcaseLayout) {
    layout.value = value
    vibe?.setReelInfoSheet(false)
    vibe?.setLayout(value)
  }

  function toggleAutoScroll() {
    vibe?.setAutoScroll(!autoScrolling.value, 70)
  }

  async function reset() {
    request?.abort()
    request = null
    filtering.value = false
    error.value = ''
    vibe?.setAutoScroll(false)
    vibe?.setLoadMoreLocked(false)
    vibe?.setReelInfoSheet(false)
    try {
      if (vibe) await vibe.reload()
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
    if (target.value) stopReelReveal = attachReelEntryReveal(target.value)
    viewport = window.matchMedia('(max-width: 600px)')
    viewport.addEventListener('change', resize)
    observer = new MutationObserver(countRendered)
    if (target.value) observer.observe(target.value, { childList: true, subtree: true })
    void initialize().catch(() => { error.value = 'The demo could not start. Restart it to try again.' })
  })
  onBeforeUnmount(() => {
    generation++
    request?.abort()
    observer?.disconnect()
    stopReelReveal?.()
    viewport?.removeEventListener('change', resize)
    vibe?.destroy()
    vibe = null
  })

  return { filter, layout, loaded, rendered, busy, status, autoScrolling, error,
    chooseFilter, chooseLayout, toggleAutoScroll, reset }
}
