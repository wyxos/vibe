#!/usr/bin/env node

import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'

const args = process.argv.slice(2)
const wait = args.includes('--wait')
const timeoutMs = Number.parseInt(
  args.find((arg) => arg.startsWith('--timeout-ms='))?.slice('--timeout-ms='.length) ?? '300000',
  10,
)
const intervalMs = Number.parseInt(
  args.find((arg) => arg.startsWith('--interval-ms='))?.slice('--interval-ms='.length) ?? '10000',
  10,
)

const packageJson = JSON.parse(readFileSync('package.json', 'utf8'))
const packageName = packageJson.name
const packageVersion = packageJson.version

function runNpm(args) {
  const npmCli = resolveNpmCli()

  if (npmCli) {
    return execFileSync(process.execPath, [npmCli, ...args], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    }).trim()
  }

  return execFileSync('npm', args, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim()
}

function resolveNpmCli() {
  if (process.env.npm_execpath && existsSync(process.env.npm_execpath)) {
    return process.env.npm_execpath
  }

  const siblingCli = path.join(
    path.dirname(process.execPath),
    'node_modules',
    'npm',
    'bin',
    'npm-cli.js',
  )

  if (existsSync(siblingCli)) {
    return siblingCli
  }

  return null
}

function readPublishedVersion() {
  const output = runNpm(['view', `${packageName}@${packageVersion}`, 'version', '--json'])

  return JSON.parse(output)
}

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

const startedAt = Date.now()
let lastError = null

do {
  try {
    const publishedVersion = readPublishedVersion()

    if (publishedVersion !== packageVersion) {
      throw new Error(
        `npm returned ${JSON.stringify(publishedVersion)} for ${packageName}@${packageVersion}.`,
      )
    }

    console.log(`${packageName}@${packageVersion} is visible on npm.`)
    process.exit(0)
  }
  catch (error) {
    lastError = error

    if (!wait || Date.now() - startedAt >= timeoutMs) {
      break
    }

    await sleep(intervalMs)
  }
} while (wait)

console.error(`${packageName}@${packageVersion} is not visible on npm yet.`)

if (lastError instanceof Error && lastError.message) {
  console.error(lastError.message)
}

process.exit(1)
