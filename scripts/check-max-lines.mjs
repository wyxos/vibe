#!/usr/bin/env node

import { readdirSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'

const cwd = process.cwd()
const args = process.argv.slice(2)
const maxLines = Number.parseInt(
  args.find((arg) => arg.startsWith('--max='))?.slice('--max='.length) ?? '500',
  10,
)
const reportBaseline = args.includes('--report-baseline')
const roots = args.filter((arg) => !arg.startsWith('--') && arg.trim() !== '')
const scanRoots = roots.length > 0 ? roots : ['src', 'tests', 'scripts']

if (!Number.isFinite(maxLines) || maxLines <= 0) {
  console.error('Invalid --max value.')
  process.exit(1)
}

const extensions = new Set(['.js', '.mjs', '.ts', '.tsx', '.vue'])
const ignoredDirectories = new Set([
  '.git',
  'coverage',
  'dist',
  'lib',
  'node_modules',
  'playwright-report',
  'test-results',
])

const legacyBaseline = new Map([
  ['src/components/viewer-core/useAutoResolveSource.ts', 622],
  ['src/components/viewer-core/useMasonryList.ts', 654],
  ['tests/unit/Vibe.test.ts', 738],
  ['tests/unit/useDataSource.test.ts', 872],
])

function normalizePath(filePath) {
  return filePath.split(path.sep).join('/')
}

function lineCount(filePath) {
  const content = readFileSync(filePath, 'utf8')

  if (content.length === 0) {
    return 0
  }

  return content.replace(/\r?\n$/, '').split(/\r\n|\r|\n/).length
}

function collectFiles(root) {
  const absoluteRoot = path.resolve(cwd, root)

  try {
    if (!statSync(absoluteRoot).isDirectory()) {
      return []
    }
  }
  catch {
    return []
  }

  const files = []
  const pending = [absoluteRoot]

  while (pending.length > 0) {
    const current = pending.pop()

    for (const entry of readdirSync(current, { withFileTypes: true })) {
      const absolutePath = path.join(current, entry.name)

      if (entry.isDirectory()) {
        if (!ignoredDirectories.has(entry.name)) {
          pending.push(absolutePath)
        }

        continue
      }

      if (entry.isFile() && extensions.has(path.extname(entry.name))) {
        files.push(absolutePath)
      }
    }
  }

  return files
}

const violations = []
const baselineFiles = []

for (const root of scanRoots) {
  for (const file of collectFiles(root)) {
    const relativePath = normalizePath(path.relative(cwd, file))
    const lines = lineCount(file)

    if (lines <= maxLines) {
      continue
    }

    const baseline = legacyBaseline.get(relativePath)

    if (baseline === undefined) {
      violations.push({ path: relativePath, lines, reason: 'not in baseline' })

      continue
    }

    if (lines > baseline) {
      violations.push({
        path: relativePath,
        lines,
        reason: `baseline ${baseline}`,
      })

      continue
    }

    baselineFiles.push({ path: relativePath, lines, baseline })
  }
}

violations.sort((a, b) => b.lines - a.lines)
baselineFiles.sort((a, b) => b.lines - a.lines)

if (violations.length > 0) {
  console.error(`Max-lines violations (>${maxLines} lines):`)

  for (const violation of violations) {
    console.error(`- ${violation.path}: ${violation.lines} (${violation.reason})`)
  }

  process.exit(1)
}

console.log(
  `Max-lines check: no new JS/TS/Vue violations above ${maxLines} lines. Legacy baseline files still above limit: ${legacyBaseline.size}.`,
)

if (reportBaseline && baselineFiles.length > 0) {
  console.log('Legacy baseline files:')

  for (const file of baselineFiles) {
    console.log(`- ${file.path}: ${file.lines} (baseline ${file.baseline})`)
  }
}
