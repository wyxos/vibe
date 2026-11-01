import assert from 'node:assert/strict'
import { fork } from 'node:child_process'
import { once } from 'node:events'
import { fileURLToPath } from 'node:url'
import { test } from 'node:test'
import { chromium } from '@playwright/test'

test('owned browsers close on success, failure, interruption and parent loss; unrelated browser survives', async () => {
  const unrelated = await chromium.launch({ headless: true })
  const workerFile = fileURLToPath(new URL('./guard-worker.mjs', import.meta.url))
  const guard = new URL('../../scripts/playwright-guard.mjs', import.meta.url).href
  try {
    for (const mode of ['success', 'failure', 'interrupted', 'parent-loss']) {
      const child = fork(workerFile, mode === 'parent-loss' ? ['supervisor'] : [], {
        execArgv: mode === 'parent-loss' ? [] : ['--import', guard],
        stdio: ['ignore', 'inherit', 'inherit', 'ipc'], windowsHide: true,
        detached: process.platform !== 'win32',
      })
      let remote
      try {
        const ready = await once(child, 'message', { signal: AbortSignal.timeout(15000) })
        remote = await chromium.connect(ready[0].endpoint)
        const closed = once(remote, 'disconnected', { signal: AbortSignal.timeout(15000) })
        const exited = once(child, 'exit', { signal: AbortSignal.timeout(15000) })
        if (mode === 'parent-loss') child.kill('SIGKILL')
        else child.send(mode === 'interrupted'
          ? { type: 'vibe-test-shutdown' }
          : { type: 'finish', code: mode === 'success' ? 0 : 1 })
        await closed
        const [code] = await exited
        if (mode !== 'parent-loss') assert.equal(code, mode === 'success' ? 0 : mode === 'failure' ? 1 : 130)
        assert.equal(unrelated.isConnected(), true)
        const page = await unrelated.newPage()
        await page.setContent('<p>Unrelated browser remains usable</p>')
        assert.equal(await page.locator('p').textContent(), 'Unrelated browser remains usable')
        await page.close()
      } finally {
        await remote?.close()
        if (child.exitCode === null && child.signalCode === null) {
          if (child.connected) child.send({ type: 'vibe-test-shutdown' })
          else child.kill()
        }
      }
    }
  } finally {
    await unrelated.close()
  }
})
