import { spawnSync } from 'node:child_process'

let stopping = false

function shutdown() {
  if (stopping) return
  stopping = true
  // IPC closes even when the launcher is killed unexpectedly. Ask Playwright
  // to close its browsers through its normal SIGINT handler first.
  if (!process.emit('SIGINT')) process.exit(130)
  // A bounded shutdown deadline is needed if Playwright's cleanup hangs.
  // This is a one-shot failure deadline, never a status poll.
  setTimeout(() => {
    if (process.platform === 'win32') {
      spawnSync('taskkill.exe', ['/PID', String(process.pid), '/T', '/F'], {
        windowsHide: true, stdio: 'ignore',
      })
    } else {
      process.kill(-process.pid, 'SIGKILL')
    }
  }, 10000).unref()
}

// Playwright workers inherit Node's --import arguments. Only the directly
// owned CLI process supervises launcher loss; worker IPC remains untouched.
if (!process.env.VIBE_GUARD_PARENT || Number(process.env.VIBE_GUARD_PARENT) === process.ppid) {
  process.channel?.unref()
  process.once('disconnect', shutdown)
  process.once('SIGTERM', shutdown)
  process.on('message', (message) => {
    if (message?.type === 'vibe-test-shutdown') shutdown()
  })
}
