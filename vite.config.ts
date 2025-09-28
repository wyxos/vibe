import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import { VueMcp } from 'vite-plugin-vue-mcp'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue(), tailwindcss(), VueMcp()],
  test: {
    environment: 'jsdom',
    globals: true,
  },
})
