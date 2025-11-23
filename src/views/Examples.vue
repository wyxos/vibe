<template>
  <div class="min-h-screen bg-slate-50 pt-20">
    <div class="max-w-7xl mx-auto px-4 py-8">
      <div class="flex gap-8">
        <!-- Side Menu -->
        <aside class="hidden lg:block w-64 flex-shrink-0 sticky top-24 h-fit">
          <nav class="bg-white rounded-lg shadow-sm p-4 border border-slate-200">
            <h3 class="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Examples</h3>
            <ul class="space-y-2">
              <li v-for="example in examples" :key="example.id">
                <a
                  :href="`#${example.id}`"
                  @click.prevent="scrollTo(example.id)"
                  class="block px-3 py-2 text-sm rounded-md transition-colors"
                  :class="activeSection === example.id 
                    ? 'bg-blue-50 text-blue-600 font-medium' 
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'"
                >
                  {{ example.title }}
                </a>
              </li>
            </ul>
          </nav>
        </aside>

        <!-- Main Content -->
        <main class="flex-1 min-w-0">
          <div class="space-y-16">
            <!-- Basic Example -->
            <section id="basic" ref="basicRef" class="scroll-mt-24">
              <div class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div class="px-6 py-4 border-b border-slate-200 bg-slate-50">
                  <h2 class="text-2xl font-bold text-slate-800">Basic Usage</h2>
                  <p class="text-slate-600 mt-1">Simple masonry grid with default MasonryItem component</p>
                </div>
                
                <!-- Live Example -->
                <div class="p-6 bg-slate-50">
                  <div class="bg-white rounded-lg border border-slate-200 p-4" style="height: 500px;">
                    <BasicExample />
                  </div>
                </div>

                <!-- Code Tabs -->
                <div class="px-6 pb-6">
                  <CodeTabs
                    vue='<script setup>
import { ref } from "vue";
import { Masonry } from "@wyxos/vibe";

const items = ref([]);

async function getNextPage(page) {
  const response = await fetch(`/api/items?page=${page}`);
  const data = await response.json();
  return {
    items: data.items,
    nextPage: page + 1
  };
}
</script>

<template>
  <Masonry
    v-model:items="items"
    :get-next-page="getNextPage"
    :load-at-page="1"
  />
</template>'
                  />
                </div>
              </div>
            </section>

            <!-- Custom Masonry Item Example -->
            <section id="custom-item" ref="customItemRef" class="scroll-mt-24">
              <div class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div class="px-6 py-4 border-b border-slate-200 bg-slate-50">
                  <h2 class="text-2xl font-bold text-slate-800">Custom Masonry Item</h2>
                  <p class="text-slate-600 mt-1">Customize item rendering with scoped slots</p>
                </div>
                
                <!-- Live Example -->
                <div class="p-6 bg-slate-50">
                  <div class="bg-white rounded-lg border border-slate-200 p-4" style="height: 500px;">
                    <CustomItemExample />
                  </div>
                </div>

                <!-- Code Tabs -->
                <div class="px-6 pb-6">
                  <CodeTabs
                    vue='<script setup>
import { ref } from "vue";
import { Masonry } from "@wyxos/vibe";

const items = ref([]);

async function getNextPage(page) {
  const response = await fetch(`/api/items?page=${page}`);
  const data = await response.json();
  return {
    items: data.items,
    nextPage: page + 1
  };
}
</script>

<template>
  <Masonry
    v-model:items="items"
    :get-next-page="getNextPage"
    :load-at-page="1"
  >
    <template #item="{ item, remove }">
      <div class="custom-card">
        <img :src="item.src" :alt="item.title" />
        <div class="overlay">
          <h3>{{ item.title }}</h3>
          <button @click="remove">Remove</button>
        </div>
      </div>
    </template>
  </Masonry>
</template>'
                  />
                </div>
                -->
              </div>
            </section>

            <!-- Header & Footer Example -->
            <section id="header-footer" ref="headerFooterRef" class="scroll-mt-24">
              <div class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div class="px-6 py-4 border-b border-slate-200 bg-slate-50">
                  <h2 class="text-2xl font-bold text-slate-800">Header & Footer</h2>
                  <p class="text-slate-600 mt-1">
                    Use `layout.header` and `layout.footer` with slots to add per-item UI like badges, titles and actions.
                  </p>
                </div>
                
                <!-- Live Example -->
                <div class="p-6 bg-slate-50">
                  <div class="bg-white rounded-lg border border-slate-200 p-4" style="height: 500px;">
                    <HeaderFooterExample />
                  </div>
                </div>

                <!-- Code Tabs omitted for this example to keep docs build-safe.
                     See the Header & Footer example component for full code. -->
              </div>
            </section>

            <!-- Swipe Mode Example -->
            <section id="swipe-mode" ref="swipeModeRef" class="scroll-mt-24">
              <div class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div class="px-6 py-4 border-b border-slate-200 bg-slate-50">
                  <h2 class="text-2xl font-bold text-slate-800">Swipe Mode</h2>
                  <p class="text-slate-600 mt-1">Vertical swipe feed for mobile devices</p>
                </div>
                
                <!-- Live Example -->
                <div class="p-6 bg-slate-50">
                  <div class="bg-white rounded-lg border border-slate-200 p-4" style="height: 500px;">
                    <SwipeModeExample />
                  </div>
                </div>

                <!-- Code Tabs -->
                <div class="px-6 pb-6">
                  <CodeTabs
                    vue='<script setup>
import { ref } from "vue";
import { Masonry } from "@wyxos/vibe";

const items = ref([]);

async function getNextPage(page) {
  const response = await fetch(`/api/items?page=${page}`);
  const data = await response.json();
  return {
    items: data.items,
    nextPage: page + 1
  };
}
</script>

<template>
  <!-- Auto mode: switches to swipe on mobile -->
  <Masonry
    v-model:items="items"
    :get-next-page="getNextPage"
    layout-mode="auto"
    :mobile-breakpoint="768"
  />

  <!-- Force swipe mode on all devices -->
  <Masonry
    v-model:items="items"
    :get-next-page="getNextPage"
    layout-mode="swipe"
  />
</template>'
                  />
                </div>
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// @ts-nocheck - documentation page with inline string code samples that Vue/TS can't statically analyze cleanly
import { ref, onMounted, onUnmounted } from 'vue'
import CodeTabs from '../components/CodeTabs.vue'
import BasicExample from '../components/examples/BasicExample.vue'
import CustomItemExample from '../components/examples/CustomItemExample.vue'
import SwipeModeExample from '../components/examples/SwipeModeExample.vue'
import HeaderFooterExample from '../components/examples/HeaderFooterExample.vue'

const examples = [
  { id: 'basic', title: 'Basic Usage' },
  { id: 'custom-item', title: 'Custom Masonry Item' },
  { id: 'header-footer', title: 'Header & Footer' },
  { id: 'swipe-mode', title: 'Swipe Mode' }
]

const activeSection = ref('basic')
const basicRef = ref<HTMLElement | null>(null)
const customItemRef = ref<HTMLElement | null>(null)
const headerFooterRef = ref<HTMLElement | null>(null)
const swipeModeRef = ref<HTMLElement | null>(null)

function scrollTo(id: string) {
  const element = document.getElementById(id)
  if (element) {
    element.scrollIntoView({ behavior: 'smooth', block: 'start' })
    activeSection.value = id
  }
}

function updateActiveSection() {
  const sections = [
    { id: 'basic', ref: basicRef },
    { id: 'custom-item', ref: customItemRef },
    { id: 'header-footer', ref: headerFooterRef },
    { id: 'swipe-mode', ref: swipeModeRef }
  ]

  const scrollPosition = window.scrollY + 100

  for (let i = sections.length - 1; i >= 0; i--) {
    const section = sections[i]
    if (section.ref.value) {
      const top = section.ref.value.offsetTop
      if (scrollPosition >= top) {
        activeSection.value = section.id
        break
      }
    }
  }
}

onMounted(() => {
  window.addEventListener('scroll', updateActiveSection)
  updateActiveSection()
})

onUnmounted(() => {
  window.removeEventListener('scroll', updateActiveSection)
})
</script>
