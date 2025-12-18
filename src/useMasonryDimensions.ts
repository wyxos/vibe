import { ref, type Ref } from 'vue'

export interface UseMasonryDimensionsOptions {
  masonry: Ref<any[]>
}

export function useMasonryDimensions(options: UseMasonryDimensionsOptions) {
  const { masonry } = options

  // Track items with invalid dimensions to avoid duplicate warnings
  const invalidDimensionIds = ref<Set<number | string>>(new Set())

  function isPositiveNumber(value: any): boolean {
    return typeof value === 'number' && value > 0 && Number.isFinite(value)
  }

  function checkItemDimensions(items: any[], context: string) {
    try {
      if (!Array.isArray(items) || items.length === 0) return
      const missing = items.filter((item) => !isPositiveNumber(item?.width) || !isPositiveNumber(item?.height))
      if (missing.length === 0) return

      const newIds: Array<number | string> = []
      for (const item of missing) {
        const id = (item?.id as number | string | undefined) ?? `idx:${masonry.value.indexOf(item)}`
        if (!invalidDimensionIds.value.has(id)) {
          invalidDimensionIds.value.add(id)
          newIds.push(id)
        }
      }
      if (newIds.length > 0) {
        const sample = newIds.slice(0, 10)
        // eslint-disable-next-line no-console
        console.warn(
          '[Masonry] Items missing width/height detected:',
          {
            context,
            count: newIds.length,
            sampleIds: sample,
            hint: 'Ensure each item has positive width and height. Consider providing fallbacks (e.g., 512x512) at the data layer.'
          }
        )
      }
    } catch {
      // best-effort diagnostics only
    }
  }

  function reset() {
    invalidDimensionIds.value.clear()
  }

  return {
    checkItemDimensions,
    invalidDimensionIds,
    reset
  }
}

