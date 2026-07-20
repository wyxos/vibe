import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'
import type { Connect } from 'vite'
import { defineConfig } from 'vite'
import { fileURLToPath, URL } from 'node:url'

function demoErrorAssetMiddleware(): Connect.NextHandleFunction {
  return (request, response, next) => {
    const status = request.url?.match(
      /^\/demo-errors\/(401|403|404|419|500)\//,
    )?.[1]

    if (status) {
      response.statusCode = Number(status)
      response.setHeader('Cache-Control', 'no-store')
      response.setHeader('Content-Type', 'text/plain; charset=utf-8')
      response.end(`Demo media error ${status}`)
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
  server: {
    proxy: {
      '/docs': {
        target: 'http://127.0.0.1:5174',
        changeOrigin: true,
        ws: true,
      },
    },
  },
})
