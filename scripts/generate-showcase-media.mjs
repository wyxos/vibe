import { spawn } from 'node:child_process'
import { once } from 'node:events'
import { mkdir, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

// Entirely original, deterministic fixture sources. No network or sampled media.
const output = fileURLToPath(new URL('../site/public/media/', import.meta.url))
const ffmpeg = process.env.VIBE_FIXTURE_FFMPEG ?? 'ffmpeg'
await mkdir(output, { recursive: true })
const svg = (width, height, background, content) => `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><rect width="${width}" height="${height}" fill="${background}"/>${content}</svg>`
const circle = (x, y, r, fill, extra = '') => `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}" ${extra}/>`
const line = (x1, y1, x2, y2, stroke, width = 1) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${stroke}" stroke-width="${width}"/>`
const rect = (x, y, width, height, fill, extra = '') => `<rect x="${x}" y="${y}" width="${width}" height="${height}" fill="${fill}" ${extra}/>`

const graphics = [
  ['orbital-study.svg', 900, 1200, '#e9e1cd', () => {
    let marks = circle(450, 530, 248, '#19272c') + circle(450, 530, 165, '#e9e1cd')
    for (let i = 0; i < 24; i++) {
      const angle = i * Math.PI / 12
      marks += line(450 + Math.cos(angle) * 275, 530 + Math.sin(angle) * 275,
        450 + Math.cos(angle) * 326, 530 + Math.sin(angle) * 326, '#19272c', 2)
    }
    return marks + circle(450, 282, 63, '#ff5b35') + rect(118, 995, 665, 3, '#19272c')
  }],
  ['ribbon-grid.svg', 1200, 900, '#121d23', () => {
    let marks = ''
    for (let i = 0; i < 24; i++) {
      const y = 140 + i * 25
      marks += `<path d="M 100 ${y} C 350 ${y - 220}, 700 ${y + 290}, 1100 ${y - 65}" fill="none" stroke="${i < 12 ? '#d6b88b' : '#ee643f'}" stroke-width="9"/>`
    }
    return marks
  }],
  ['solar-stack.svg', 1000, 1250, '#e75232', () => {
    let marks = ''
    for (let i = 0; i < 5; i++) marks += circle(500, 265 + i * 180, 170, i % 2 ? '#e7d8be' : '#252d30')
    return marks
  }],
  ['blueprint-bloom.svg', 1000, 1000, '#d8dfd5', () => {
    let marks = ''
    for (let i = 0; i < 18; i++) {
      marks += `<ellipse cx="500" cy="500" rx="300" ry="105" fill="none" stroke="#214e53" stroke-width="2" transform="rotate(${i * 10} 500 500)"/>`
    }
    return marks + circle(500, 500, 80, '#ed663c')
  }],
  ['color-field.svg', 1200, 1000, '#f0e5ce', () => {
    let marks = ''
    const colors = ['#273e43', '#e8673b', '#e9b454', '#6a8c85', '#decba5']
    for (let x = 0; x < 5; x++) for (let y = 0; y < 4; y++) {
      marks += rect(100 + x * 200, 100 + y * 200, 190, 190, colors[(x + y * 2) % colors.length])
      marks += circle(195 + x * 200, 195 + y * 200, 59, colors[(x + y * 2 + 2) % colors.length])
    }
    return marks
  }],
  ['signal-noon.svg', 900, 1100, '#e5b244', () => {
    let marks = ''
    for (let i = 0; i < 13; i++) marks += rect(120 + i * 52, 180 + Math.sin(i * 0.65) * 120, 20, 610, '#252b2c')
    return marks + circle(450, 510, 155, '#f2dfb8') + circle(450, 510, 102, '#df5b39')
  }],
  ['night-index.svg', 1200, 800, '#1a2a30', () => {
    let marks = ''
    for (let i = 0; i < 42; i++) {
      const x = 100 + (i % 7) * 166
      const y = 100 + Math.floor(i / 7) * 120
      marks += circle(x, y, 9 + ((i * 7) % 32), i % 4 === 0 ? '#f46a43' : '#d4c3a4')
    }
    return marks
  }],
  ['quiet-frequency.svg', 1000, 1000, '#d6d9c4', () => {
    let marks = circle(500, 500, 345, '#263e3e')
    for (let i = 0; i < 36; i++) {
      const x = 200 + i * 17
      const height = 40 + Math.abs(Math.sin(i * 0.28)) * 340
      marks += line(x, 500 - height / 2, x, 500 + height / 2, '#e4d8b7', 6)
    }
    return marks + circle(500, 500, 29, '#ed6b43')
  }],
]
for (const [name, width, height, background, draw] of graphics) {
  await writeFile(path.join(output, name), svg(width, height, background, draw()))
}

function audio() {
  const sampleRate = 24000, seconds = 10
  const samples = sampleRate * seconds
  const data = Buffer.alloc(44 + samples * 2)
  data.write('RIFF', 0); data.writeUInt32LE(data.length - 8, 4); data.write('WAVEfmt ', 8)
  data.writeUInt32LE(16, 16); data.writeUInt16LE(1, 20); data.writeUInt16LE(1, 22)
  data.writeUInt32LE(sampleRate, 24); data.writeUInt32LE(sampleRate * 2, 28)
  data.writeUInt16LE(2, 32); data.writeUInt16LE(16, 34); data.write('data', 36)
  data.writeUInt32LE(samples * 2, 40)
  const notes = [130.8128, 195.9977, 261.6256, 293.6648]
  for (let sample = 0; sample < samples; sample++) {
    const t = sample / sampleRate
    const fade = Math.min(1, t / 1.6, (seconds - t) / 2)
    let signal = 0
    for (let note = 0; note < notes.length; note++) {
      signal += Math.sin(2 * Math.PI * notes[note] * t) * (0.55 + Math.sin(t * 0.58 + note) * 0.2)
      signal += Math.sin(2 * Math.PI * notes[note] * 2 * t) * 0.09
    }
    data.writeInt16LE(Math.round(signal / notes.length * fade * 6500), 44 + sample * 2)
  }
  return data
}
await writeFile(path.join(output, 'quiet-frequency.wav'), audio())

async function motion(name, width, height, variant) {
  const fps = 24, duration = 6
  const child = spawn(ffmpeg, ['-hide_banner', '-loglevel', 'error', '-y', '-f', 'rawvideo',
    '-pixel_format', 'rgb24', '-video_size', `${width}x${height}`, '-framerate', String(fps),
    '-i', 'pipe:0', '-an', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '24',
    '-pix_fmt', 'yuv420p', '-movflags', '+faststart', path.join(output, name)],
  { stdio: ['pipe', 'ignore', 'inherit'], windowsHide: true })
  const exited = once(child, 'exit')
  for (let frame = 0; frame < fps * duration; frame++) {
    const pixels = Buffer.allocUnsafe(width * height * 3)
    const time = frame / (fps * duration) * Math.PI * 2
    for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
      const u = (x - width / 2) / width * 3
      const v = (y - height / 2) / height * 3
      const radius = Math.hypot(u, v)
      const angle = Math.atan2(v, u)
      const wave = variant === 1
        ? Math.sin(radius * 8 - time + Math.sin(angle * 3 + time) * 1.4)
        : Math.sin(u * 3 + time + Math.sin(v * 4 - time) * 2)
      const band = Math.pow(Math.max(0, 1 - Math.abs(wave) * 1.35), 2)
      const halo = Math.max(0, 1 - radius / 2.1)
      const index = (y * width + x) * 3
      pixels[index] = 13 + 218 * band * halo + 38 * (wave + 1) * halo
      pixels[index + 1] = 24 + 80 * band * halo + 57 * (1 - band) * halo
      pixels[index + 2] = 31 + 48 * band * halo + 91 * (1 - band) * halo
    }
    if (!child.stdin.write(pixels)) await once(child.stdin, 'drain')
  }
  child.stdin.end()
  const [code] = await exited
  if (code !== 0) throw new Error('Original motion fixture encoding failed')
}

await motion('chromatic-orbit.mp4', 576, 768, 1)
await motion('phase-shift.mp4', 960, 540, 2)
console.log('Created 8 original SVG artworks, 2 original motion loops and 1 synthesized audio fixture.')
