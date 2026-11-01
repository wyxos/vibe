import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  root: fileURLToPath(new URL('./', import.meta.url)),
  publicDir: 'public',
  plugins: [tailwindcss(), vue()],
  server: { host: '127.0.0.1', port: 5175, strictPort: false },
  build: {
    outDir: fileURLToPath(new URL('../dist-site', import.meta.url)),
    emptyOutDir: true,
  },
})
