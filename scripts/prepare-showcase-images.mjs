import { spawn } from 'node:child_process'
import { readFile, stat, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

// Encoding-only delivery derivatives. Original generated PNGs and dimensions
// stay unchanged; no crop, resize, or creative transformation is performed.
const directory = new URL('../site/public/media/', import.meta.url)
const ffmpeg = process.env.VIBE_FIXTURE_FFMPEG ?? 'ffmpeg'
const records = await Promise.all([1, 2, 3, 4].map(async (index) => {
  const stem = `image-${String(index).padStart(2, '0')}`
  const source = fileURLToPath(new URL(`${stem}.png`, directory))
  const destination = fileURLToPath(new URL(`${stem}.webp`, directory))
  await new Promise((resolve, reject) => {
    const child = spawn(ffmpeg, ['-y', '-loglevel', 'error', '-i', source,
      '-c:v', 'libwebp', '-quality', '82', '-compression_level', '6', destination],
    { stdio: ['ignore', 'ignore', 'inherit'], windowsHide: true })
    child.once('error', reject)
    child.once('exit', (code) => code === 0 ? resolve() : reject(new Error('Image delivery encoding failed')))
  })
  const png = await readFile(source)
  return { file: `${stem}.webp`, source: `${stem}.png`, kind: 'delivery-encoding',
    encoding: 'WebP quality82; original dimensions preserved',
    width: png.readUInt32BE(16), height: png.readUInt32BE(20), bytes: (await stat(destination)).size }
}))
const manifestPath = new URL('provenance.json', directory)
const manifest = JSON.parse(await readFile(manifestPath, 'utf8'))
manifest.deliveryDerivatives = records
await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`)
console.log(JSON.stringify({ deliveryImages: records.length, totalBytes: records.reduce((sum, item) => sum + item.bytes, 0) }))
