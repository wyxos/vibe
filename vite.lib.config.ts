import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// Library build config — outputs ESM to lib/
export default defineConfig({
  build: {
    lib: {
      entry: 'index.ts',
      name: 'Vibe',
      fileName: () => 'index.js',
      formats: ['es'],
    },
    rollupOptions: {
      external: ['vue'],
      output: {
        globals: { vue: 'Vue' },
      },
    },
    outDir: 'lib',
    emptyOutDir: false,
  },
  publicDir: false, // Don't copy public assets to lib
  plugins: [vue()],
})
