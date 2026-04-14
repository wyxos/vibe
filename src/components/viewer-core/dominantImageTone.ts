export interface DominantImageTone {
  r: number
  g: number
  b: number
}

export function extractDominantImageTone(image: HTMLImageElement): DominantImageTone | null {
  if (image.naturalWidth <= 0 || image.naturalHeight <= 0) {
    return null
  }

  const canvas = document.createElement('canvas')
  const context = canvas.getContext('2d', { willReadFrequently: true })
  if (!context) {
    return null
  }

  const sampleSize = 24
  canvas.width = sampleSize
  canvas.height = sampleSize

  try {
    context.drawImage(image, 0, 0, sampleSize, sampleSize)
    const { data } = context.getImageData(0, 0, sampleSize, sampleSize)
    let totalWeight = 0
    let redSum = 0
    let greenSum = 0
    let blueSum = 0

    for (let offset = 0; offset < data.length; offset += 4) {
      const alpha = data[offset + 3] / 255
      if (alpha <= 0.05) {
        continue
      }

      const red = data[offset]
      const green = data[offset + 1]
      const blue = data[offset + 2]
      const max = Math.max(red, green, blue)
      const min = Math.min(red, green, blue)
      const saturation = max === 0 ? 0 : (max - min) / max
      const weight = alpha * (0.65 + saturation * 0.7)

      totalWeight += weight
      redSum += red * weight
      greenSum += green * weight
      blueSum += blue * weight
    }

    if (totalWeight <= 0) {
      return null
    }

    return {
      r: clampColor(Math.round(redSum / totalWeight)),
      g: clampColor(Math.round(greenSum / totalWeight)),
      b: clampColor(Math.round(blueSum / totalWeight)),
    }
  }
  catch {
    return null
  }
}

function clampColor(channel: number) {
  return Math.min(235, Math.max(26, channel))
}
