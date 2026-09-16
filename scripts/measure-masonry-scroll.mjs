#!/usr/bin/env node

import { writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { chromium } from '@playwright/test'
import { createServer } from 'vite'

const host = '127.0.0.1'
const port = 4173
const baseURL = `http://${host}:${port}`
const speedPxPerSecond = 320
const scrollMs = 15_000

const server = await createServer({
  server: { host, port, strictPort: true },
})
await server.listen()

const browser = await chromium.launch({ channel: 'chrome', headless: true })
const page = await browser.newPage({
  viewport: { width: 1440, height: 900 },
})

function metricNumber(value) {
  return Number(String(value).replace(/[^\d.-]/g, ''))
}

async function readMetrics() {
  return page.evaluate(() => {
    const text = (selector) => document.querySelector(selector)?.textContent?.trim() ?? ''
    const gallery = document.querySelector('.masonry-feed')
    const preview = document.querySelector('.media-preview')
    return {
      inspected: text('[data-test="performance-inspected"]'),
      loaded: text('[data-test="performance-loaded"]'),
      longTasks: text('[data-test="performance-long-tasks"]'),
      mediaReady: text('[data-test="performance-media-ready"]'),
      mediaVisible: text('[data-test="performance-media-visible"]'),
      mount: text('[data-test="performance-mount"]'),
      mounted: text('[data-test="performance-mounted"]'),
      p95: text('[data-test="performance-p95"]'),
      plateau: text('[data-test="performance-plateau"]'),
      previewSrc: preview?.getAttribute('src') ?? '',
      removal: text('[data-test="performance-removal"]'),
      removalLongTasks: text('[data-test="performance-removal-long-tasks"]'),
      removalP95: text('[data-test="performance-removal-p95"]'),
      removalPlateau: text('[data-test="performance-removal-plateau"]'),
      removalWorst: text('[data-test="performance-removal-worst"]'),
      requested: text('[data-test="performance-requested"]'),
      travelled: text('[data-test="performance-travelled"]'),
      visible: text('[data-test="performance-visible"]'),
      windowChanges: text('[data-test="performance-window-changes"]'),
      worst: text('[data-test="performance-worst"]'),
      scrollHeight: gallery?.scrollHeight ?? 0,
      scrollTop: gallery?.scrollTop ?? 0,
      clientHeight: gallery?.clientHeight ?? 0,
    }
  })
}

async function waitForLoaded(count) {
  await page.waitForFunction(
    (expected) => document.querySelector('[data-test="performance-loaded"]')?.textContent?.trim() === expected,
    String(count),
    { timeout: 120_000 },
  )
  await page.waitForFunction(
    () => Number(document.querySelector('[data-test="performance-mounted"]')?.textContent ?? '0') > 0,
    undefined,
    { timeout: 30_000 },
  )
}

async function setSpeed(pxPerSecond) {
  await page.locator('[data-test="auto-scroll-speed"]').evaluate((element, value) => {
    const input = element
    input.value = String(value)
    input.dispatchEvent(new Event('input', { bubbles: true }))
  }, pxPerSecond)
}

async function measure(count, remount) {
  const buttonName = count === 9000 ? '9,000' : '100'
  const switchStarted = Date.now()
  if (remount) {
    await page.getByRole('button', { name: buttonName, exact: true }).click()
  }
  await waitForLoaded(count)
  const readyMs = Date.now() - switchStarted
  const afterMount = await readMetrics()
  await setSpeed(speedPxPerSecond)
  await page.getByRole('button', { name: 'Start auto scroll' }).click()
  await page.waitForTimeout(scrollMs)
  await page.getByRole('button', { name: 'Stop auto scroll' }).click()
  await page.waitForTimeout(600)
  const afterScroll = await readMetrics()
  await page.waitForFunction(
    () => Number(document.querySelector('[data-test="performance-visible"]')?.textContent ?? '0') > 0,
  )
  await page.locator('[data-test="performance-remove-visible"]').click()
  await page.waitForFunction(
    () => Number(document.querySelector('[data-test="performance-removal"]')?.textContent?.replace(/[^\d.-]/g, '') ?? '0') > 0,
    undefined,
    { timeout: 15_000 },
  )
  const afterRemoval = await readMetrics()
  const requested = metricNumber(afterScroll.requested)
  const travelled = metricNumber(afterScroll.travelled)
  return {
    count,
    speedPxPerSecond,
    scrollMs,
    readyMs,
    mountMs: metricNumber(afterMount.mount),
    previewKind: afterMount.previewSrc.startsWith('blob:') ? 'blob-jpeg' : afterMount.previewSrc.slice(0, 24),
    loaded: metricNumber(afterScroll.loaded),
    mounted: metricNumber(afterScroll.mounted),
    visible: metricNumber(afterScroll.visible),
    inspected: metricNumber(afterScroll.inspected),
    requestedPx: requested,
    travelledPx: travelled,
    travelRatio: requested === 0 ? 0 : travelled / requested,
    plateauMs: metricNumber(afterScroll.plateau),
    p95FrameMs: metricNumber(afterScroll.p95),
    worstFrameMs: metricNumber(afterScroll.worst),
    longTasks: afterScroll.longTasks,
    windowChanges: metricNumber(afterScroll.windowChanges),
    mediaReady: metricNumber(afterScroll.mediaReady),
    mediaVisible: metricNumber(afterScroll.mediaVisible),
    removalMs: metricNumber(afterRemoval.removal),
    removalP95FrameMs: metricNumber(afterRemoval.removalP95),
    removalWorstFrameMs: metricNumber(afterRemoval.removalWorst),
    removalPlateauMs: metricNumber(afterRemoval.removalPlateau),
    removalLongTasks: afterRemoval.removalLongTasks,
    loadedAfterRemoval: metricNumber(afterRemoval.loaded),
    scrollHeight: afterScroll.scrollHeight,
    scrollTop: afterScroll.scrollTop,
    clientHeight: afterScroll.clientHeight,
  }
}

try {
  await page.goto(`${baseURL}/demos/masonry-performance`)
  await waitForLoaded(100)
  const small = await measure(100, false)
  const large = await measure(9000, true)
  const results = {
    capturedAt: new Date().toISOString(),
    viewport: '1440x900',
    media: 'unique-jpeg',
    jpegWidth: 450,
    runs: [small, large],
  }
  const outputPath = join(tmpdir(), 'vibe-masonry-scroll-comparison.json')
  await writeFile(outputPath, `${JSON.stringify(results, null, 2)}\n`)
  results.outputPath = outputPath
  console.log(JSON.stringify(results, null, 2))
}
finally {
  await browser.close()
  await server.close()
}
