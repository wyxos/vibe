import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'
import type { Connect } from 'vite'
import { defineConfig } from 'vite'
import { fileURLToPath, URL } from 'node:url'

function demoErrorAssetMiddleware(): Connect.NextHandleFunction {
  return (request, response, next) => {
    if (request.url?.startsWith('/demo-missing/proof-sheet-404.jpg')) {
      response.statusCode = 404
      response.end()
      return
    }

    next()
  }
}

export default defineConfig({
  plugins: [
    tailwindcss(),
    vue(),
    {
      name: 'vibe-demo-error-assets',
      configurePreviewServer(server) {
        server.middlewares.use(demoErrorAssetMiddleware())
      },
      configureServer(server) {
        server.middlewares.use(demoErrorAssetMiddleware())
      },
    },
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
