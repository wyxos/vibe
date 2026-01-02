import { onBeforeUnmount, ref } from 'vue'

export function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

export function highlightVueSnippet(source: string): string {
  const escaped = escapeHtml(source)

  // Minimal highlighting for Vue template-ish code using Tailwind tokens.
  const withMustache = escaped.replaceAll(
    /\{\{([\s\S]*?)\}\}/g,
    '<span class="text-violet-700">{{</span><span class="text-slate-900">$1</span><span class="text-violet-700">}}</span>'
  )

  const withStrings = withMustache.replaceAll(
    /(&quot;[\s\S]*?&quot;|&#39;[\s\S]*?&#39;)/g,
    '<span class="text-emerald-700">$1</span>'
  )

  return withStrings.replaceAll(
    /(&lt;\/?)([A-Za-z][A-Za-z0-9-]*)([\s\S]*?)(&gt;)/g,
    (_m, p1, tag, rest, p4) => {
      const highlightedRest = String(rest)
        .replaceAll(
          /\s(v-[a-zA-Z0-9-]+|:[a-zA-Z0-9-]+|@[a-zA-Z0-9-]+|#[a-zA-Z0-9-]+)/g,
          ' <span class="text-blue-700">$1</span>'
        )
        .replaceAll(
          /\s([a-zA-Z_:][a-zA-Z0-9_:\-.]*)(=)/g,
          ' <span class="text-blue-700">$1</span>$2'
        )

      return `<span class="text-slate-500">${p1}</span><span class="text-cyan-700">${tag}</span>${highlightedRest}<span class="text-slate-500">${p4}</span>`
    }
  )
}

export function useCopyToClipboard(getText: () => string) {
  const copyStatus = ref<'idle' | 'copied'>('idle')

  let resetTimeout: number | null = null

  onBeforeUnmount(() => {
    if (resetTimeout) {
      window.clearTimeout(resetTimeout)
      resetTimeout = null
    }
  })

  async function copy() {
    if (resetTimeout) {
      window.clearTimeout(resetTimeout)
      resetTimeout = null
    }

    const text = getText()

    try {
      await navigator.clipboard.writeText(text)
    } catch {
      const textarea = document.createElement('textarea')
      textarea.value = text
      textarea.setAttribute('readonly', '')
      textarea.style.position = 'fixed'
      textarea.style.left = '-9999px'
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
    }

    copyStatus.value = 'copied'
    resetTimeout = window.setTimeout(() => {
      copyStatus.value = 'idle'
      resetTimeout = null
    }, 1500)
  }

  return { copyStatus, copy }
}
