<script setup lang="ts">
import { Menu, X } from 'lucide-vue-next'
import packageJson from '../../package.json'
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { RouterLink, RouterView, useRoute } from 'vue-router'

const route = useRoute()
const isMenuOpen = ref(false)
const menuButtonRef = ref<HTMLButtonElement | null>(null)
const menuSheetRef = ref<HTMLElement | null>(null)

const workspaceLinks = [
  {
    to: '/',
    label: 'Home',
  },
  {
    to: '/demo/bidirectional-paging',
    label: 'Advanced Integration Demo',
  },
  {
    to: '/debug/fake-server',
    label: 'Fake Server Debug',
  },
]

watch(
  () => route.fullPath,
  () => {
    isMenuOpen.value = false
  },
)

watch(isMenuOpen, async (open) => {
  await nextTick()

  if (open) {
    const firstInteractiveElement = menuSheetRef.value?.querySelector<HTMLElement>('a, button')
    firstInteractiveElement?.focus()
    return
  }

  menuButtonRef.value?.focus()
})

onMounted(() => {
  window.addEventListener('keydown', onKeydown)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeydown)
})

function closeMenu() {
  isMenuOpen.value = false
}

function toggleMenu() {
  isMenuOpen.value = !isMenuOpen.value
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    closeMenu()
  }
}
</script>

<template>
  <section class="flex h-full min-h-0 flex-col bg-[#05060a] text-[#f7f1ea]">
    <header class="relative z-40 border-b border-white/12 bg-[linear-gradient(180deg,rgba(6,7,10,0.96),rgba(6,7,10,0.84))] backdrop-blur-[20px]">
      <div class="mx-auto flex min-h-[4.75rem] w-full max-w-[1600px] items-center justify-between gap-4 px-5 py-4 sm:px-6">
        <div class="min-w-0">
          <p class="text-[0.68rem] font-bold uppercase tracking-[0.32em] text-[#f7f1ea]/52">
            Vibe {{ packageJson.version }}
          </p>
          <p class="mt-1 text-[0.9rem] font-medium tracking-[-0.02em] text-[#f7f1ea]/78">
            Workspace demos
          </p>
        </div>

        <button
          ref="menuButtonRef"
          data-testid="workspace-menu-button"
          type="button"
          class="inline-flex h-11 w-11 items-center justify-center border border-white/14 bg-black/20 text-[#f7f1ea]/82 transition hover:border-white/28 hover:bg-black/35 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#f7f1ea]"
          aria-label="Open workspace menu"
          :aria-expanded="isMenuOpen ? 'true' : 'false'"
          :aria-controls="'workspace-menu-sheet'"
          @click="toggleMenu"
        >
          <Menu class="h-4 w-4 stroke-[2.2]" aria-hidden="true" />
        </button>
      </div>
    </header>

    <div class="relative min-h-0 flex-1">
      <RouterView />
    </div>

    <div
      class="fixed inset-0 z-50"
      :class="isMenuOpen ? '' : 'pointer-events-none'"
      aria-live="polite"
    >
      <button
        type="button"
        class="absolute inset-0 bg-black/58 transition duration-300"
        :class="isMenuOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'"
        :tabindex="isMenuOpen ? 0 : -1"
        aria-label="Close workspace menu"
        @click="closeMenu"
      />

      <aside
        ref="menuSheetRef"
        id="workspace-menu-sheet"
        data-testid="workspace-menu-sheet"
        class="absolute inset-y-0 right-0 flex w-full max-w-[24rem] flex-col border-l border-white/12 bg-[#08090d] shadow-[-28px_0_80px_-48px_rgba(0,0,0,0.92)] transition-transform duration-300"
        :class="isMenuOpen ? 'pointer-events-auto translate-x-0' : 'pointer-events-none translate-x-full'"
        :data-open="isMenuOpen ? 'true' : 'false'"
        :inert="!isMenuOpen"
        role="dialog"
        aria-modal="true"
        aria-label="Workspace navigation"
      >
        <div class="flex items-start justify-between gap-4 border-b border-white/10 px-5 py-5 sm:px-6">
          <div class="min-w-0">
            <p class="text-[0.68rem] font-bold uppercase tracking-[0.32em] text-[#f7f1ea]/46">
              Navigate
            </p>
            <p class="mt-2 text-[1.05rem] leading-tight tracking-[-0.03em] text-[#f7f1ea]/82">
              Workspace routes
            </p>
          </div>

          <button
            type="button"
            class="inline-flex h-11 w-11 items-center justify-center border border-white/12 bg-black/30 text-[#f7f1ea]/72 transition hover:border-white/24 hover:bg-black/45 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#f7f1ea]"
            aria-label="Close workspace menu"
            @click="closeMenu"
          >
            <X class="h-4 w-4 stroke-[2.2]" aria-hidden="true" />
          </button>
        </div>

        <nav class="flex flex-1 flex-col px-5 py-4 sm:px-6" aria-label="Workspace">
          <RouterLink
            v-for="link in workspaceLinks"
            :key="link.to"
            :to="link.to"
            class="flex items-center justify-between border-b border-white/10 py-4 text-[0.82rem] font-bold uppercase tracking-[0.22em] text-[#f7f1ea]/72 transition hover:text-[#f7f1ea]"
            active-class="text-[#f7f1ea]"
            exact-active-class="text-[#f7f1ea]"
            @click="closeMenu"
          >
            <span>{{ link.label }}</span>
            <span class="text-[#f7f1ea]/34">/</span>
          </RouterLink>
        </nav>
      </aside>
    </div>
  </section>
</template>
