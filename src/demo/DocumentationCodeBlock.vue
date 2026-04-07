<script setup lang="ts">
import { Check, Copy } from 'lucide-vue-next'
import { computed, onBeforeUnmount, ref } from 'vue'

import {
  type DocumentationCodeLanguage,
  highlightDocumentationCode,
} from '@/demo/documentationCode'

const props = defineProps<{
  code: string
  language: DocumentationCodeLanguage
  sectionId: string
}>()

const copyState = ref<'copy' | 'copied' | 'failed'>('copy')
let copyFeedbackTimer: number | null = null

const highlightedCode = computed(() =>
  highlightDocumentationCode(props.code, props.language),
)

onBeforeUnmount(() => {
  clearCopyFeedbackTimer()
})

async function onCopyClick() {
  try {
    await copyTextToClipboard(props.code)
    setCopyState('copied')
  }
  catch {
    setCopyState('failed')
  }
}

function setCopyState(state: 'copy' | 'copied' | 'failed') {
  copyState.value = state
  clearCopyFeedbackTimer()

  copyFeedbackTimer = window.setTimeout(() => {
    copyState.value = 'copy'
    copyFeedbackTimer = null
  }, 1_800)
}

function clearCopyFeedbackTimer() {
  if (copyFeedbackTimer === null) {
    return
  }

  window.clearTimeout(copyFeedbackTimer)
  copyFeedbackTimer = null
}

async function copyTextToClipboard(value: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value)
    return
  }

  const textarea = document.createElement('textarea')
  textarea.value = value
  textarea.setAttribute('readonly', 'true')
  textarea.className = 'fixed left-[-9999px] top-0 opacity-0'
  document.body.append(textarea)
  textarea.select()

  const didCopy = document.execCommand('copy')
  textarea.remove()

  if (!didCopy) {
    throw new Error('Copy failed')
  }
}
</script>

<template>
  <div class="mt-5 border border-white/12 bg-[#06070b]">
    <div class="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
      <div class="flex items-center gap-3">
        <span class="text-[0.64rem] font-bold uppercase tracking-[0.22em] text-[#f7f1ea]/38">
          Example
        </span>
        <span class="border border-white/10 px-2 py-1 text-[0.62rem] font-bold uppercase tracking-[0.18em] text-[#f7f1ea]/48">
          {{ language }}
        </span>
      </div>

      <button
        :data-testid="`docs-copy-${sectionId}`"
        type="button"
        class="inline-flex items-center gap-2 border border-white/12 px-3 py-2 text-[0.64rem] font-bold uppercase tracking-[0.2em] text-[#f7f1ea]/62 transition hover:border-white/22 hover:text-[#f7f1ea] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#f7f1ea]"
        @click="onCopyClick"
      >
        <Check
          v-if="copyState === 'copied'"
          class="h-3.5 w-3.5 stroke-[2.1]"
          aria-hidden="true"
        />
        <Copy
          v-else
          class="h-3.5 w-3.5 stroke-[2.1]"
          aria-hidden="true"
        />
        <span>
          {{ copyState === 'copied' ? 'Copied' : copyState === 'failed' ? 'Copy failed' : 'Copy code' }}
        </span>
      </button>
    </div>

    <pre
      :data-testid="`docs-code-${sectionId}`"
      class="overflow-x-auto px-4 py-4 text-[0.8rem] leading-6 text-[#f7f1ea]/86"
    ><code class="block min-w-full whitespace-pre font-mono" v-html="highlightedCode" /></pre>
  </div>
</template>
