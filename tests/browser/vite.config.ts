import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'
import { fileURLToPath, URL } from 'node:url'

const root = fileURLToPath(new URL('./', import.meta.url))

export default defineConfig({
  root,
  publicDir: fileURLToPath(new URL('../fixtures', import.meta.url)),
  plugins: [tailwindcss(), vue(), {
    name: 'synthetic-test-assets',
    configureServer(server) {
      server.middlewares.use((request, response, next) => {
        if (request.url?.startsWith('/media/')) {
          response.setHeader('Content-Type', 'image/svg+xml')
          response.end('<svg xmlns="http://www.w3.org/2000/svg" width="400" height="600"><rect width="400" height="600" fill="#64748b"/></svg>')
        } else if (request.url === '/audio.wav') {
          // One second of valid silent PCM audio; no external fixture service.
          const wav = Buffer.alloc(44 + 16000)
          wav.write('RIFF', 0); wav.writeUInt32LE(wav.length - 8, 4); wav.write('WAVEfmt ', 8)
          wav.writeUInt32LE(16, 16); wav.writeUInt16LE(1, 20); wav.writeUInt16LE(1, 22)
          wav.writeUInt32LE(8000, 24); wav.writeUInt32LE(16000, 28)
          wav.writeUInt16LE(2, 32); wav.writeUInt16LE(16, 34); wav.write('data', 36)
          wav.writeUInt32LE(16000, 40)
          response.setHeader('Content-Type', 'audio/wav'); response.end(wav)
        } else next()
      })
    },
  }],
  resolve: {
    alias: {
      '@vibe-under-test': fileURLToPath(new URL(process.env.VIBE_TEST_BUILT === '1' ? '../../lib/index.js' : '../../src/index.ts', import.meta.url)),
      '@vibe-style': fileURLToPath(new URL(process.env.VIBE_TEST_BUILT === '1' ? '../../lib/style.css' : '../../src/vibe.css', import.meta.url)),
    },
  },
})
