import { defineConfig } from '@playwright/test'

const noVisuals = process.env.VIBE_TEST_NO_VISUALS === '1'

export default defineConfig({
  testDir: '../e2e',
  testMatch: 'library*.spec.ts',
  fullyParallel: true,
  workers: 4,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: 'list',
  expect: { timeout: 10000 },
  use: {
    baseURL: process.env.VIBE_TEST_URL,
    viewport: { width: 1440, height: 900 },
    trace: noVisuals ? 'off' : 'on-first-retry',
    screenshot: noVisuals ? 'off' : 'only-on-failure',
    video: noVisuals ? 'off' : 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { browserName: 'chromium' } }],
})
