import type { VibeItem } from '@/index'

export const SYNTHETIC_JPEG_WIDTH = 450
export const SYNTHETIC_LAYOUT_WIDTH = 800
export const SYNTHETIC_JPEG_QUALITY = 0.55

const ASPECT_VARIANTS = 5
const OBJECT_URLS: string[] = []

const FALLBACK_JPEG = Uint8Array.from(atob(
  '/9j/4AAQSkZJRgABAQAAAQABAAD/2wCEAAkGBwgHBgkIBwgKCgkLDRYPDQwMDRsUFRAWIB0iIiAdHx8kKDQsJCYxJx8fLT0tMTU3Ojo6Iys/RD84QzQ5OjcBCgoKDQwNGg8PGjclHyU3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3N//AABEIAAEAAQMBEQACEQEDEQH/xAAUAAEAAAAAAAAAAAAAAAAAAAAK/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEAMQAAAAywP/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/9oACAEBAAE/AL//xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oACAECAQE/AL//xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oACAEDAQE/AL//2Q==',
), (character) => character.charCodeAt(0))

export function syntheticLayoutHeight(index: number): number {
  return 800 + ((index % ASPECT_VARIANTS) * 120)
}

export function syntheticJpegHeight(index: number): number {
  return Math.round(SYNTHETIC_JPEG_WIDTH * syntheticLayoutHeight(index) / SYNTHETIC_LAYOUT_WIDTH)
}

export function releaseSyntheticMasonryMedia(): void {
  OBJECT_URLS.forEach((url) => URL.revokeObjectURL(url))
  OBJECT_URLS.length = 0
}

export async function createSyntheticMasonryItems(
  count: number,
  mode: 'shared' | 'unique',
): Promise<VibeItem[]> {
  releaseSyntheticMasonryMedia()
  const templates = await Promise.all(
    Array.from({ length: ASPECT_VARIANTS }, (_, variant) => encodeTemplate(variant)),
  )
  if (mode === 'shared') {
    const source = retain(jpegBlob(templates[0]!))
    return Array.from({ length: count }, (_, index) => item(index, source))
  }

  return Array.from({ length: count }, (_, index) => {
    const jpeg = insertJpegComment(templates[index % ASPECT_VARIANTS]!, `unique-${index}`)
    return item(index, retain(jpegBlob(jpeg)))
  })
}

function item(index: number, source: string): VibeItem {
  const width = SYNTHETIC_LAYOUT_WIDTH
  const height = syntheticLayoutHeight(index)
  return {
    height,
    items: [],
    postId: index + 1,
    preview: {
      height: syntheticJpegHeight(index),
      src: source,
      type: 'image',
      width: SYNTHETIC_JPEG_WIDTH,
    },
    src: source,
    type: 'image',
    width,
  }
}

function retain(blob: Blob): string {
  const url = URL.createObjectURL(blob)
  OBJECT_URLS.push(url)
  return url
}

function jpegBlob(bytes: Uint8Array): Blob {
  const buffer = new ArrayBuffer(bytes.byteLength)
  new Uint8Array(buffer).set(bytes)
  return new Blob([buffer], { type: 'image/jpeg' })
}

function insertJpegComment(jpeg: Uint8Array, comment: string): Uint8Array {
  const end = jpeg.length >= 2
    && jpeg[jpeg.length - 2] === 0xFF
    && jpeg[jpeg.length - 1] === 0xD9
    ? jpeg.length - 2
    : jpeg.length
  const payload = new TextEncoder().encode(comment)
  const length = payload.length + 2
  const next = new Uint8Array(end + 4 + payload.length + 2)
  next.set(jpeg.subarray(0, end))
  let offset = end
  next[offset] = 0xFF
  next[offset + 1] = 0xFE
  next[offset + 2] = (length >> 8) & 0xFF
  next[offset + 3] = length & 0xFF
  next.set(payload, offset + 4)
  offset += 4 + payload.length
  next[offset] = 0xFF
  next[offset + 1] = 0xD9
  return next
}

async function encodeTemplate(variant: number): Promise<Uint8Array> {
  const width = SYNTHETIC_JPEG_WIDTH
  const height = syntheticJpegHeight(variant)
  if (typeof document === 'undefined') return FALLBACK_JPEG

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d')
  if (!context) return FALLBACK_JPEG

  context.fillStyle = '#172033'
  context.fillRect(0, 0, width, height)
  context.fillStyle = `hsl(${variant * 72} 55% 45%)`
  context.beginPath()
  context.moveTo(0, height * 0.76)
  context.lineTo(width * 0.32, height * 0.41)
  context.lineTo(width * 0.54, height * 0.63)
  context.lineTo(width * 0.7, height * 0.47)
  context.lineTo(width, height)
  context.lineTo(0, height)
  context.closePath()
  context.fill()
  context.fillStyle = `hsl(${(variant * 72 + 40) % 360} 70% 58%)`
  context.beginPath()
  context.arc(width * 0.78, height * 0.21, width * 0.11, 0, Math.PI * 2)
  context.fill()

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, 'image/jpeg', SYNTHETIC_JPEG_QUALITY)
  })
  if (!blob) return FALLBACK_JPEG
  return new Uint8Array(await blob.arrayBuffer())
}
