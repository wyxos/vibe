#!/usr/bin/env node

import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { createServer, preview } from 'vite'

const args = process.argv.slice(2)
const built = args.includes('--built')
const playwrightArgs = args.filter((arg) => arg !== '--built')
const host = '127.0.0.1'
const port = built ? 4174 : 4173
const playwrightCli = fileURLToPath(import.meta.resolve('@playwright/test/cli'))

const server = built
  ? await preview({
      preview: { host, port, strictPort: true },
    })
  : await createServer({
      server: { host, port, strictPort: true },
    })

if (!built) {
  await server.listen()
}

if (built && !playwrightArgs.some((arg) => arg.startsWith('--config'))) {
  playwrightArgs.unshift('--config', 'playwright.built.config.ts')
}

try {
  const exitCode = await runPlaywright(playwrightArgs)
  process.exitCode = exitCode
}
finally {
  await server.close()
}

function runPlaywright(cliArgs) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [playwrightCli, 'test', ...cliArgs], {
      stdio: 'inherit',
      windowsHide: true,
    })

    child.once('error', reject)
    child.once('exit', (code, signal) => {
      if (signal) {
        reject(new Error(`Playwright exited from signal ${signal}.`))
        return
      }

      resolve(code ?? 1)
    })
  })
}
