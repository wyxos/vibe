import { mergeConfig } from 'vite'
import { defineConfig } from 'vitest/config'

import viteConfig from './vite.config.lib'

export default defineConfig((environment) => mergeConfig(viteConfig(environment), {
  test: {
    environment: 'jsdom',
    include: ['tests/unit/**/*.test.ts'],
    setupFiles: ['./tests/setup.ts'],
  },
}))
