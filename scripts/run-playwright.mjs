#!/usr/bin/env node
import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { createServer } from 'vite'

const args = process.argv.slice(2)
const site = args.includes('--site')
process.env.VIBE_TEST_BUILT = args.includes('--built') ? '1' : '0'
const server = await createServer({
  configFile: fileURLToPath(new URL(site ? '../site/vite.config.ts' : '../tests/browser/vite.config.ts', import.meta.url)),
  server: { host: '127.0.0.1', port: 0 },
})
let child
let interrupted = false
const shutdown = () => {
  interrupted = true
  if (child?.connected) child.send({ type: 'vibe-test-shutdown' }, () => {})
}
process.once('SIGINT', shutdown)
process.once('SIGTERM', shutdown)
const disconnect = () => { if (child?.connected) child.disconnect() }
process.once('exit', disconnect)

try {
  await server.listen()
  process.exitCode = await new Promise((resolve, reject) => {
    child = spawn(process.execPath, [
      '--import', new URL('./playwright-guard.mjs', import.meta.url).href,
      fileURLToPath(import.meta.resolve('@playwright/test/cli')), 'test',
      '--config', site ? 'tests/site/playwright.config.ts' : 'tests/browser/playwright.config.ts',
      ...args.filter((arg) => arg !== '--built' && arg !== '--site'),
    ], {
      stdio: ['inherit', 'inherit', 'inherit', 'ipc'], windowsHide: true,
      detached: process.platform !== 'win32',
      env: { ...process.env, VIBE_TEST_URL: server.resolvedUrls.local[0], VIBE_GUARD_PARENT: String(process.pid) },
    })
    child.once('error', reject)
    child.once('exit', (code) => resolve(code ?? 1))
    if (interrupted) shutdown()
  })
} finally {
  process.removeListener('SIGINT', shutdown)
  process.removeListener('SIGTERM', shutdown)
  process.removeListener('exit', disconnect)
  await server.close()
}
