import { readFile } from 'node:fs/promises'
import { relative, resolve } from 'node:path'
import process from 'node:process'

const distDir = resolve('dist')
const expectedCname = 'vibe.wyxos.com'
const errors = []

const indexHtml = await readRequired('index.html')
const fallbackHtml = await readRequired('404.html')
const docsHtml = await readRequired('docs/index.html')
const cname = await readRequired('CNAME')

if (cname !== null && cname.trim() !== expectedCname) {
  errors.push(`Expected dist/CNAME to contain "${expectedCname}", received "${cname.trim()}".`)
}

if (indexHtml !== null && fallbackHtml !== null && fallbackHtml !== indexHtml) {
  errors.push('Expected dist/404.html to match dist/index.html for GitHub Pages deep-link fallback.')
}

if (docsHtml !== null && !docsHtml.includes('<h1 id="getting-started"')) {
  errors.push('Expected dist/docs/index.html to render the Getting started documentation page.')
}

if (errors.length > 0) {
  console.error(`Built demo artifact verification failed:\n- ${errors.join('\n- ')}`)
  process.exitCode = 1
} else {
  console.log('Built demo artifact verification passed.')
}

async function readRequired(fileName) {
  const path = resolve(distDir, fileName)

  try {
    return await readFile(path, 'utf8')
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
      errors.push(`Missing ${relative(process.cwd(), path).replaceAll('\\', '/')}.`)
      return null
    }

    throw error
  }
}
