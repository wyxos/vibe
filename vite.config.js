import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [tailwindcss(), vue()],
  test: {
    environment: 'jsdom',
    include: ['tests/**/*.test.{js,ts}'],
    exclude: ['tests/e2e/**', '**/node_modules/**'],
  },
})
