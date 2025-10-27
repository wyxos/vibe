#!/usr/bin/env node
import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { readFile } from 'node:fs/promises'
import fs from 'node:fs'
import path from 'node:path'

const ROOT = dirname(fileURLToPath(import.meta.url))
const PACKAGE_PATH = join(ROOT, 'package.json')

const STEP_PREFIX = '→'
const OK_PREFIX = '✔'
const WARN_PREFIX = '⚠'

function logStep(message) {
  console.log(`${STEP_PREFIX} ${message}`)
}

function logSuccess(message) {
  console.log(`${OK_PREFIX} ${message}`)
}

function logWarning(message) {
  console.warn(`${WARN_PREFIX} ${message}`)
}

function runCommand(command, args, { cwd = ROOT, capture = false } = {}) {
  return new Promise((resolve, reject) => {
    const spawnOptions = {
      cwd,
      stdio: capture ? ['ignore', 'pipe', 'pipe'] : 'inherit',
      shell: process.platform === 'win32'
    }

    const child = spawn(command, args, spawnOptions)
    let stdout = ''
    let stderr = ''

    if (capture) {
      child.stdout.on('data', (chunk) => {
        stdout += chunk
      })

      child.stderr.on('data', (chunk) => {
        stderr += chunk
      })
    }

    child.on('error', reject)
    child.on('close', (code) => {
      if (code === 0) {
        resolve(capture ? { stdout: stdout.trim(), stderr: stderr.trim() } : undefined)
      } else {
        const error = new Error(`Command failed (${code}): ${command} ${args.join(' ')}`)
        if (capture) {
          error.stdout = stdout
          error.stderr = stderr
        }
        error.exitCode = code
        reject(error)
      }
    })
  })
}

async function readPackage() {
  const raw = await readFile(PACKAGE_PATH, 'utf8')
  return JSON.parse(raw)
}

async function ensureCleanWorkingTree() {
  const { stdout } = await runCommand('git', ['status', '--porcelain'], { capture: true })

  if (stdout.length > 0) {
    throw new Error('Working tree has uncommitted changes. Commit or stash them before releasing.')
  }
}

async function getCurrentBranch() {
  const { stdout } = await runCommand('git', ['branch', '--show-current'], { capture: true })
  return stdout || null
}

async function getUpstreamRef() {
  try {
    const { stdout } = await runCommand('git', ['rev-parse', '--abbrev-ref', '--symbolic-full-name', '@{u}'], {
      capture: true
    })

    return stdout || null
  } catch {
    return null
  }
}

async function ensureUpToDateWithUpstream(branch, upstreamRef) {
  if (!upstreamRef) {
    logWarning(`Branch ${branch} has no upstream configured; skipping ahead/behind checks.`)
    return
  }

  const [remoteName, ...branchParts] = upstreamRef.split('/')
  const remoteBranch = branchParts.join('/')

  if (remoteName && remoteBranch) {
    logStep(`Fetching latest updates from ${remoteName}/${remoteBranch}...`)
    try {
      await runCommand('git', ['fetch', remoteName, remoteBranch])
    } catch (error) {
      throw new Error(`Failed to fetch ${upstreamRef}: ${error.message}`)
    }
  }

  const aheadResult = await runCommand('git', ['rev-list', '--count', `${upstreamRef}..HEAD`], {
    capture: true
  })
  const behindResult = await runCommand('git', ['rev-list', '--count', `HEAD..${upstreamRef}`], {
    capture: true
  })

  const ahead = Number.parseInt(aheadResult.stdout || '0', 10)
  const behind = Number.parseInt(behindResult.stdout || '0', 10)

  if (Number.isFinite(behind) && behind > 0) {
    if (remoteName && remoteBranch) {
      logStep(`Fast-forwarding ${branch} with ${upstreamRef}...`)

      try {
        await runCommand('git', ['pull', '--ff-only', remoteName, remoteBranch])
      } catch (error) {
        throw new Error(
          `Unable to fast-forward ${branch} with ${upstreamRef}. Resolve conflicts manually, then rerun the release.\n${error.message}`
        )
      }

      return ensureUpToDateWithUpstream(branch, upstreamRef)
    }

    throw new Error(
      `Branch ${branch} is behind ${upstreamRef} by ${behind} commit${behind === 1 ? '' : 's'}. Pull or rebase first.`
    )
  }

  if (Number.isFinite(ahead) && ahead > 0) {
    logWarning(`Branch ${branch} is ahead of ${upstreamRef} by ${ahead} commit${ahead === 1 ? '' : 's'}.`)
  }
}

function parseArgs() {
  const args = process.argv.slice(2)
  const positionals = args.filter((arg) => !arg.startsWith('--'))
  const flags = new Set(args.filter((arg) => arg.startsWith('--')))

  const releaseType = positionals[0] ?? 'patch'
  const skipTests = flags.has('--skip-tests')
  const skipLint = flags.has('--skip-lint')
  const skipBuild = flags.has('--skip-build')
  const skipDeploy = flags.has('--skip-deploy')

  const allowedTypes = new Set([
    'major',
    'minor',
    'patch',
    'premajor',
    'preminor',
    'prepatch',
    'prerelease'
  ])

  if (!allowedTypes.has(releaseType)) {
    throw new Error(
      `Invalid release type "${releaseType}". Use one of: ${Array.from(allowedTypes).join(', ')}.`
    )
  }

  return { releaseType, skipTests, skipLint, skipBuild, skipDeploy }
}

async function runLint(skipLint) {
  if (skipLint) {
    logWarning('Skipping lint because --skip-lint flag was provided.')
    return
  }

  const pkg = await readPackage()
  if (!pkg.scripts?.lint) {
    logWarning('No lint script found in package.json, skipping.')
    return
  }

  logStep('Running lint...')
  await runCommand('npm', ['run', 'lint'])
  logSuccess('Lint passed.')
}

async function runTests(skipTests) {
  if (skipTests) {
    logWarning('Skipping tests because --skip-tests flag was provided.')
    return
  }

  logStep('Running test suite...')
  await runCommand('npm', ['test', '--', '--run'])
  logSuccess('Tests passed.')
}

async function runBuild(skipBuild) {
  if (skipBuild) {
    logWarning('Skipping build because --skip-build flag was provided.')
    return
  }

  logStep('Building project...')
  await runCommand('npm', ['run', 'build'])
  logSuccess('Build completed.')
}

async function ensureNpmAuth() {
  logStep('Confirming npm authentication...')
  await runCommand('npm', ['whoami'])
}

async function bumpVersion(releaseType) {
  logStep(`Bumping package version with "npm version ${releaseType}"...`)
  await runCommand('npm', ['version', releaseType, '--message', 'chore: release %s'])
  const pkg = await readPackage()
  logSuccess(`Version updated to ${pkg.version}.`)
  return pkg
}

async function pushChanges() {
  logStep('Pushing commits and tags to origin...')
  await runCommand('git', ['push', '--follow-tags'])
  logSuccess('Git push completed.')
}

async function publishPackage(pkg) {
  const publishArgs = ['publish']

  if (pkg.name.startsWith('@')) {
    publishArgs.push('--access', 'public')
  }

  logStep(`Publishing ${pkg.name}@${pkg.version} to npm...`)
  await runCommand('npm', publishArgs)
  logSuccess('npm publish completed.')
}

async function deployGHPages(skipDeploy) {
  if (skipDeploy) {
    logWarning('Skipping GitHub Pages deployment because --skip-deploy flag was provided.')
    return
  }

  logStep('Deploying to GitHub Pages...')

  // Write CNAME file to dist
  const distPath = path.join(ROOT, 'dist')
  const cnamePath = path.join(distPath, 'CNAME')
  fs.writeFileSync(cnamePath, 'vibe.wyxos.com')

  const worktreeDir = path.resolve('.gh-pages')

  try {
    await runCommand('git', ['worktree', 'remove', worktreeDir, '-f'])
  } catch {}

  try {
    await runCommand('git', ['worktree', 'add', worktreeDir, 'gh-pages'])
  } catch {
    await runCommand('git', ['worktree', 'add', worktreeDir, '-b', 'gh-pages'])
  }

  await runCommand('git', ['-C', worktreeDir, 'config', 'user.name', 'wyxos'])
  await runCommand('git', ['-C', worktreeDir, 'config', 'user.email', 'github@wyxos.com'])

  // Clear worktree directory
  for (const entry of fs.readdirSync(worktreeDir)) {
    if (entry === '.git') continue
    const target = path.join(worktreeDir, entry)
    fs.rmSync(target, { recursive: true, force: true })
  }

  // Copy dist to worktree
  fs.cpSync(distPath, worktreeDir, { recursive: true })

  await runCommand('git', ['-C', worktreeDir, 'add', '-A'])
  await runCommand('git', ['-C', worktreeDir, 'commit', '-m', `deploy: demo ${new Date().toISOString()}`, '--allow-empty'])
  await runCommand('git', ['-C', worktreeDir, 'push', '-f', 'origin', 'gh-pages'])

  logSuccess('GitHub Pages deployment completed.')
}

async function main() {
  const { releaseType, skipTests, skipLint, skipBuild, skipDeploy } = parseArgs()

  logStep('Reading package metadata...')
  const pkg = await readPackage()

  logStep('Checking working tree status...')
  await ensureCleanWorkingTree()

  const branch = await getCurrentBranch()
  if (!branch) {
    throw new Error('Unable to determine current branch.')
  }

  logStep(`Current branch: ${branch}`)
  const upstreamRef = await getUpstreamRef()
  await ensureUpToDateWithUpstream(branch, upstreamRef)

  await runLint(skipLint)
  await runTests(skipTests)
  await runBuild(skipBuild)
  await ensureNpmAuth()

  const updatedPkg = await bumpVersion(releaseType)
  await pushChanges()
  await publishPackage(updatedPkg)
  await deployGHPages(skipDeploy)

  logSuccess(`Release workflow completed for ${updatedPkg.name}@${updatedPkg.version}.`)
}

main().catch((error) => {
  console.error('\nRelease failed:')
  console.error(error.message)
  process.exit(1)
})
