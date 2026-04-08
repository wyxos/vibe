<script setup lang="ts">
import { computed, nextTick, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import DocumentationCodeBlock from '@/demo/DocumentationCodeBlock.vue'
import { documentationGroups } from '@/demo/documentationContent'

const route = useRoute()
const router = useRouter()
const sections = computed(() => documentationGroups.flatMap((group) => group.items))

watch(
  () => route.hash,
  async (hash) => {
    if (!hash) {
      return
    }

    await scrollToSection(hash.slice(1), 'auto')
  },
)

onMounted(async () => {
  if (!route.hash) {
    return
  }

  await nextTick()
  await scrollToSection(route.hash.slice(1), 'auto')
})

async function onSectionLinkClick(id: string) {
  await scrollToSection(id, 'smooth')

  if (route.hash === `#${id}`) {
    return
  }

  await router.replace({
    hash: `#${id}`,
  })
}

async function scrollToSection(id: string, behavior: ScrollBehavior) {
  await nextTick()

  const element = document.getElementById(id)
  element?.scrollIntoView({
    behavior,
    block: 'start',
  })
}

function isActiveSection(id: string) {
  return route.hash === `#${id}` || (!route.hash && id === documentationGroups[0]?.items[0]?.id)
}
</script>

<template>
  <section data-testid="documentation-page" class="h-full overflow-auto bg-[#05060a] text-[#f7f1ea]">
    <div class="px-5 py-6 sm:px-6 lg:px-8">
      <div class="mt-6 grid gap-6 lg:grid-cols-[17rem_minmax(0,1fr)] lg:gap-8">
        <aside
          data-testid="documentation-aside"
          class="border border-white/12 bg-black/20 px-4 py-5 lg:sticky lg:top-0 lg:self-start"
        >
          <div
            v-for="group in documentationGroups"
            :key="group.title"
            class="border-b border-white/10 pb-5 last:border-b-0 last:pb-0"
          >
            <p class="text-[0.64rem] font-bold uppercase tracking-[0.24em] text-[#f7f1ea]/36">
              {{ group.title }}
            </p>
            <nav class="mt-3 flex flex-col gap-1.5" :aria-label="group.title">
              <a
                v-for="item in group.items"
                :key="item.id"
                :href="`#${item.id}`"
                :data-testid="`docs-nav-${item.id}`"
                class="border px-3 py-2 text-[0.78rem] font-medium transition"
                :class="isActiveSection(item.id)
                  ? 'border-white/26 bg-white/[0.06] text-[#f7f1ea]'
                  : 'border-white/10 text-[#f7f1ea]/62 hover:border-white/18 hover:text-[#f7f1ea]'"
                @click.prevent="onSectionLinkClick(item.id)"
              >
                {{ item.label }}
              </a>
            </nav>
          </div>
        </aside>

        <div data-testid="documentation-content" class="space-y-6">
          <article
            v-for="section in sections"
            :id="section.id"
            :key="section.id"
            :data-testid="`docs-section-${section.id}`"
            class="scroll-mt-6 border border-white/12 bg-[linear-gradient(180deg,rgba(0,0,0,0.18),rgba(255,255,255,0.02))] px-5 py-5 sm:px-6"
          >
            <div class="flex items-start justify-between gap-4 border-b border-white/10 pb-4">
              <div>
                <p class="text-[0.66rem] font-bold uppercase tracking-[0.24em] text-[#f7f1ea]/36">
                  {{ section.label }}
                </p>
                <h2 class="mt-2 text-[1.35rem] font-semibold tracking-[-0.03em] text-[#f7f1ea] sm:text-[1.55rem]">
                  {{ section.title }}
                </h2>
              </div>

              <a
                :href="`#${section.id}`"
                class="shrink-0 border border-white/12 px-3 py-2 text-[0.68rem] font-bold uppercase tracking-[0.22em] text-[#f7f1ea]/54 transition hover:border-white/22 hover:text-[#f7f1ea]"
                @click.prevent="onSectionLinkClick(section.id)"
              >
                Link
              </a>
            </div>

            <div class="mt-4 space-y-3 text-[0.95rem] leading-7 text-[#f7f1ea]/70">
              <p v-for="paragraph in section.description" :key="paragraph">
                {{ paragraph }}
              </p>
            </div>

            <ul
              v-if="section.notes?.length"
              class="mt-4 space-y-2 border border-white/10 bg-black/18 px-4 py-4 text-[0.88rem] leading-6 text-[#f7f1ea]/66"
            >
              <li v-for="note in section.notes" :key="note">
                {{ note }}
              </li>
            </ul>

            <DocumentationCodeBlock
              :code="section.code"
              :language="section.language"
              :section-id="section.id"
            />
          </article>
        </div>
      </div>
    </div>
  </section>
</template>
