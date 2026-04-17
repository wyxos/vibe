import { copyFile, writeFile } from 'node:fs/promises'

await writeFile('dist/CNAME', 'vibe.wyxos.com')

// GitHub Pages serves 404.html for deep links, so mirror the SPA shell there.
await copyFile('dist/index.html', 'dist/404.html')
