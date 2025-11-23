<template>
  <div class="bg-slate-900 rounded-lg overflow-hidden shadow-xl">
    <!-- Tabs -->
    <div class="flex items-center gap-1 bg-slate-800/50 px-4 py-2 border-b border-slate-700">
      <button
        v-for="tab in tabs"
        :key="tab"
        @click="activeTab = tab"
        class="px-4 py-2 text-sm font-medium rounded-md transition-colors"
        :class="activeTab === tab 
          ? 'bg-slate-700 text-white' 
          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'"
      >
        {{ tab.toUpperCase() }}
      </button>
      <div class="flex-1"></div>
      <button
        @click="copyCode"
        class="px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-700 rounded-md transition-colors flex items-center gap-2"
        :title="copied ? 'Copied!' : 'Copy code'"
      >
        <i :class="copied ? 'fas fa-check' : 'fas fa-copy'"></i>
        <span>{{ copied ? 'Copied' : 'Copy' }}</span>
      </button>
    </div>

    <!-- Code Content -->
    <div class="relative">
      <pre class="p-4 overflow-x-auto text-sm"><code :class="`language-${activeTab} hljs`" v-html="highlightedCode"></code></pre>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import hljs from 'highlight.js/lib/core'
import javascript from 'highlight.js/lib/languages/javascript'
import xml from 'highlight.js/lib/languages/xml'
import css from 'highlight.js/lib/languages/css'
import 'highlight.js/styles/tokyo-night-dark.css'

// Register languages
hljs.registerLanguage('javascript', javascript)
hljs.registerLanguage('js', javascript)
hljs.registerLanguage('xml', xml)
hljs.registerLanguage('html', xml)
hljs.registerLanguage('vue', xml) // Vue uses XML/HTML highlighting
hljs.registerLanguage('css', css)

const props = defineProps<{
  html?: string
  js?: string
  vue?: string
  css?: string
}>()

const activeTab = ref<'html' | 'js' | 'vue' | 'css'>('vue')
const copied = ref(false)

const tabs = computed(() => {
  const available: ('html' | 'js' | 'vue' | 'css')[] = []
  if (props.html) available.push('html')
  if (props.js) available.push('js')
  if (props.vue) available.push('vue')
  if (props.css) available.push('css')
  return available
})

const currentCode = computed(() => {
  switch (activeTab.value) {
    case 'html': return props.html || ''
    case 'js': return props.js || ''
    case 'vue': return props.vue || ''
    case 'css': return props.css || ''
  }
})

const highlightedCode = computed(() => {
  if (!currentCode.value) return ''
  
  try {
    // Map tab names to highlight.js language names
    const langMap: Record<string, string> = {
      'vue': 'xml',
      'html': 'xml',
      'js': 'javascript',
      'css': 'css'
    }
    
    const lang = langMap[activeTab.value] || activeTab.value
    const result = hljs.highlight(currentCode.value, { language: lang })
    return result.value
  } catch (error) {
    console.error('Highlighting error:', error)
    return escapeHtml(currentCode.value)
  }
})

function escapeHtml(text: string): string {
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}

async function copyCode() {
  try {
    await navigator.clipboard.writeText(currentCode.value)
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 2000)
  } catch (err) {
    console.error('Failed to copy:', err)
  }
}

// Set initial tab to first available
watch(() => tabs.value, (newTabs) => {
  if (newTabs.length > 0 && !newTabs.includes(activeTab.value)) {
    activeTab.value = newTabs[0]
  }
}, { immediate: true })
</script>

<style scoped>
code {
  font-family: 'Fira Code', 'Consolas', 'Monaco', 'Courier New', monospace;
  line-height: 1.6;
}

pre {
  max-height: 500px;
  overflow-y: auto;
  overflow-x: auto;
}

pre code {
  display: block;
}

pre::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

pre::-webkit-scrollbar-track {
  background: #1e293b;
}

pre::-webkit-scrollbar-thumb {
  background: #475569;
  border-radius: 4px;
}

pre::-webkit-scrollbar-thumb:hover {
  background: #64748b;
}
</style>
