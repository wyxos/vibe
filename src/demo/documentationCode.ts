export type DocumentationCodeLanguage = 'bash' | 'ts' | 'vue'

type TokenType =
  | 'attribute'
  | 'command'
  | 'comment'
  | 'directive'
  | 'identifier'
  | 'interpolation'
  | 'keyword'
  | 'number'
  | 'string'
  | 'tag'

interface TokenMatch {
  end: number
  start: number
  type: TokenType
}

const TOKEN_CLASS_MAP: Record<TokenType, string> = {
  attribute: 'text-[#ffd866]',
  command: 'text-[#78dce8]',
  comment: 'text-[#72798a] italic',
  directive: 'text-[#ab9df2]',
  identifier: 'text-[#78dce8]',
  interpolation: 'text-[#fc9867]',
  keyword: 'text-[#ff7ab8]',
  number: 'text-[#78dce8]',
  string: 'text-[#a9dc76]',
  tag: 'text-[#ff6188]',
}

export function highlightDocumentationCode(
  code: string,
  language: DocumentationCodeLanguage,
): string {
  const acceptedMatches = getAcceptedMatches(code, language)
  let cursor = 0
  let html = ''

  for (const match of acceptedMatches) {
    if (match.start > cursor) {
      html += escapeHtml(code.slice(cursor, match.start))
    }

    html += `<span class="${TOKEN_CLASS_MAP[match.type]}">${escapeHtml(code.slice(match.start, match.end))}</span>`
    cursor = match.end
  }

  if (cursor < code.length) {
    html += escapeHtml(code.slice(cursor))
  }

  return html
}

function getAcceptedMatches(code: string, language: DocumentationCodeLanguage) {
  const matches = collectMatches(code, language).sort((left, right) => {
    if (left.start !== right.start) {
      return left.start - right.start
    }

    const leftLength = left.end - left.start
    const rightLength = right.end - right.start

    return rightLength - leftLength
  })

  const acceptedMatches: TokenMatch[] = []
  let cursor = 0

  for (const match of matches) {
    if (match.start < cursor) {
      continue
    }

    acceptedMatches.push(match)
    cursor = match.end
  }

  return acceptedMatches
}

function collectMatches(code: string, language: DocumentationCodeLanguage) {
  switch (language) {
    case 'bash':
      return [
        ...getPatternMatches(code, /#.*$/gm, 'comment'),
        ...getPatternMatches(code, /"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'/g, 'string'),
        ...getPatternMatches(code, /^\s*(?:npm|pnpm|yarn|bun)\b/gm, 'command'),
        ...getPatternMatches(code, /\s(--?[a-z0-9-]+)/gi, 'directive', 1),
      ]
    case 'vue':
      return [
        ...getPatternMatches(code, /<!--[\s\S]*?-->/g, 'comment'),
        ...getPatternMatches(code, /\/\/.*$/gm, 'comment'),
        ...getPatternMatches(code, /`(?:[^`\\]|\\[\s\S])*`|"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'/g, 'string'),
        ...getPatternMatches(code, /\{\{[\s\S]*?\}\}/g, 'interpolation'),
        ...getPatternMatches(code, /<\/?[A-Za-z][\w.-]*/g, 'tag'),
        ...getPatternMatches(code, /(?<=\s)(?:#|v-|:|@)[^=\s>]+/g, 'directive'),
        ...getPatternMatches(code, /(?<=\s)[A-Za-z_][\w:.-]*(?==)/g, 'attribute'),
        ...getPatternMatches(
          code,
          /\b(?:import|from|const|let|async|await|return|type|script|template|null|true|false)\b/g,
          'keyword',
        ),
        ...getPatternMatches(code, /\b(?:Promise|ref|defineProps|defineExpose)\b/g, 'identifier'),
        ...getPatternMatches(code, /\b\d+(?:\.\d+)?\b/g, 'number'),
      ]
    case 'ts':
      return [
        ...getPatternMatches(code, /\/\/.*$/gm, 'comment'),
        ...getPatternMatches(code, /\/\*[\s\S]*?\*\//g, 'comment'),
        ...getPatternMatches(code, /`(?:[^`\\]|\\[\s\S])*`|"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'/g, 'string'),
        ...getPatternMatches(
          code,
          /\b(?:import|from|const|let|async|await|return|type|interface|function|null|true|false)\b/g,
          'keyword',
        ),
        ...getPatternMatches(
          code,
          /\b(?:Promise|Record|unknown|string|number|boolean|void|ref|console)\b/g,
          'identifier',
        ),
        ...getPatternMatches(code, /\b\d+(?:\.\d+)?\b/g, 'number'),
      ]
  }
}

function getPatternMatches(
  code: string,
  pattern: RegExp,
  type: TokenType,
  captureGroupIndex = 0,
) {
  const matches: TokenMatch[] = []

  for (const match of code.matchAll(pattern)) {
    const matchedText = match[captureGroupIndex]

    if (!matchedText) {
      continue
    }

    const fullMatch = match[0]
    const fullStart = match.index ?? 0
    const captureOffset = fullMatch.indexOf(matchedText)
    const start = fullStart + captureOffset

    matches.push({
      end: start + matchedText.length,
      start,
      type,
    })
  }

  return matches
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
}
