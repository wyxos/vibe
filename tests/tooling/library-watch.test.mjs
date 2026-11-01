import assert from 'node:assert/strict'
import { spawn, spawnSync } from 'node:child_process'
import { EventEmitter, once } from 'node:events'
import { watch } from 'node:fs'
import { cp, mkdtemp, readFile, rm, symlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { test } from 'node:test'

const project = fileURLToPath(new URL('../../', import.meta.url))

test('library watch retains package declarations and rebuilds type-only edits', async () => {
  const root = await mkdtemp(resolve(tmpdir(), 'vibe-library-watch-'))
  let child
  try {
    for (const entry of ['src', 'package.json', 'tsconfig.json', 'tsconfig.lib.json', 'vite.config.lib.ts']) {
      await cp(resolve(project, entry), resolve(root, entry), { recursive: true })
    }
    await symlink(resolve(project, 'node_modules'), resolve(root, 'node_modules'), 'junction')
    const npm = process.env.npm_execpath
      ?? resolve(dirname(process.execPath), 'node_modules/npm/bin/npm-cli.js')
    child = spawn(process.execPath, [npm, 'run', 'dev'], {
      cwd: root, stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true,
      detached: process.platform !== 'win32',
    })
    let output = ''
    const outputEvents = new EventEmitter()
    for (const stream of [child.stdout, child.stderr]) stream.on('data', (data) => {
      output += data.toString()
      outputEvents.emit('output')
    })
    // Bounded event deadlines report a failed build/watch, without polling.
    const ready = new Promise((resolveReady, reject) => {
      const deadline = setTimeout(() => reject(new Error(`Library watchers did not become ready: ${output}`)), 30000)
      const check = () => {
        if (/\[types\][\s\S]*Watching for file changes/.test(output)
          && /\[bundle\][\s\S]*built in/.test(output)) {
          clearTimeout(deadline)
          outputEvents.removeListener('output', check)
          resolveReady()
        }
      }
      outputEvents.on('output', check)
      check()
    })
    await ready
    const declaration = resolve(root, 'lib/index.d.ts')
    assert.match(await readFile(declaration, 'utf8'), /createVibe/)
    async function waitForDeclaration(expected) {
      const file = resolve(root, 'lib/core/watchProbe.d.ts')
      return new Promise((resolveReady, reject) => {
        const observer = watch(resolve(root, 'lib'), { recursive: true }, () => { void check() })
        const deadline = setTimeout(() => {
          observer.close()
          reject(new Error('Type-only declaration did not regenerate'))
        }, 15000)
        async function check() {
          const text = await readFile(file, 'utf8').catch(() => '')
          if (!text.includes(expected)) return
          clearTimeout(deadline)
          observer.close()
          resolveReady()
        }
        void check()
      })
    }
    const source = resolve(root, 'src/core/watchProbe.ts')
    const created = waitForDeclaration('first: string')
    await writeFile(source, 'export interface WatchProbe { first: string }\n')
    await created
    const updated = waitForDeclaration('second: number')
    await writeFile(source, 'export interface WatchProbe { second: number }\n')
    await updated
    const bundled = new Promise((resolveReady, reject) => {
      const observer = watch(resolve(root, 'lib'), (_event, filename) => {
        if (filename !== 'index.js') return
        clearTimeout(deadline)
        observer.close()
        resolveReady()
      })
      const deadline = setTimeout(() => {
        observer.close()
        reject(new Error('Runtime bundle did not regenerate'))
      }, 15000)
    })
    const runtimeSource = resolve(root, 'src/core/requestDelay.ts')
    await writeFile(runtimeSource, `${await readFile(runtimeSource, 'utf8')}\n// Synthetic watch rebuild.\n`)
    await bundled
    assert.match(await readFile(declaration, 'utf8'), /createVibe/)
  } finally {
    if (child && child.exitCode === null && child.signalCode === null) {
      const exited = once(child, 'exit')
      if (process.platform === 'win32') {
        spawnSync('taskkill.exe', ['/PID', String(child.pid), '/T', '/F'], { windowsHide: true, stdio: 'ignore' })
      } else process.kill(-child.pid, 'SIGTERM')
      await exited
    }
    await rm(root, { recursive: true, force: true })
  }
})
