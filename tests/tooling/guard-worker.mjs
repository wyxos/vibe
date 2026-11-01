import { fork } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { chromium } from '@playwright/test'

if (process.argv.includes('supervisor')) {
  const worker = fork(fileURLToPath(import.meta.url), [], {
    execArgv: ['--import', new URL('../../scripts/playwright-guard.mjs', import.meta.url).href],
    stdio: ['ignore', 'ignore', 'ignore', 'ipc'], windowsHide: true,
    detached: process.platform !== 'win32',
  })
  worker.on('message', (message) => process.send?.(message))
  worker.once('exit', (code) => process.exit(code ?? 1))
  process.once('disconnect', () => process.exit(0))
} else {
  const browser = await chromium.launchServer({ headless: true })
  let closing = false
  const finish = async (code) => {
    if (closing) return
    closing = true
    await browser.close()
    process.exit(code)
  }
  process.once('SIGINT', () => { void finish(130) })
  process.on('message', (message) => {
    if (message?.type === 'finish') void finish(message.code)
  })
  process.send?.({ ready: true, endpoint: browser.wsEndpoint() })
}
