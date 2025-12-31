import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [tailwindcss(), vue()],
  test: {
    environment: 'jsdom',
    include: ['tests/**/*.test.{js,ts}'],
    exclude: ['tests/e2e/**', '**/node_modules/**'],
  },
})
