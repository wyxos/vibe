import { execSync } from 'node:child_process'
import { existsSync, rmSync } from 'node:fs'
import path from 'node:path'

const cwd = process.cwd()
const tarCommand = process.platform === 'win32' ? 'tar.exe' : 'tar'

function run(command) {
  return execSync(command, {
    cwd,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  })
}

let tarballName = null

try {
  const packOutput = run('npm pack --json')
  const parsed = JSON.parse(packOutput)
  tarballName = parsed[0]?.filename ?? null

  if (!tarballName) {
    throw new Error('npm pack did not return a tarball filename.')
  }

  const tarEntries = new Set(
    run(`${tarCommand} -tf ${tarballName}`)
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean),
  )

  const requiredEntries = [
    'package/package.json',
    'package/lib/index.js',
    'package/lib/index.cjs',
    'package/lib/index.d.ts',
    'package/lib/style.css',
    'package/lib/components/Layout.vue.d.ts',
    'package/lib/components/ListCard.vue.d.ts',
    'package/lib/components/ListSurface.vue.d.ts',
    'package/lib/components/FullscreenSurface.vue.d.ts',
    'package/lib/components/viewer.d.ts',
    'package/lib/components/viewer-core/useViewer.d.ts',
    'package/lib/components/viewer-core/useDataSource.d.ts',
  ]

  const forbiddenPatterns = [
    /^package\/dist\//,
    /^package\/tests\//,
    /^package\/public\//,
    /^package\/lib\/App\.vue\.d\.ts$/,
    /^package\/lib\/main\.d\.ts$/,
    /^package\/lib\/router\.d\.ts$/,
    /^package\/lib\/pages\//,
    /^package\/lib\/demo\//,
    /^package\/lib\/[^/]+\.(?:png|jpe?g|gif|webp|ico|svg|json)$/,
  ]

  const missingEntries = requiredEntries.filter((entry) => !tarEntries.has(entry))
  const forbiddenEntries = [...tarEntries].filter((entry) =>
    forbiddenPatterns.some((pattern) => pattern.test(entry)),
  )

  if (missingEntries.length || forbiddenEntries.length) {
    const details = [
      missingEntries.length
        ? `Missing expected package files:\n- ${missingEntries.join('\n- ')}`
        : null,
      forbiddenEntries.length
        ? `Unexpected package files:\n- ${forbiddenEntries.join('\n- ')}`
        : null,
    ]
      .filter(Boolean)
      .join('\n\n')

    throw new Error(details)
  }

  console.log('Package shape OK.')
}
finally {
  if (tarballName) {
    const tarballPath = path.join(cwd, tarballName)
    if (existsSync(tarballPath)) {
      rmSync(tarballPath)
    }
  }
}
