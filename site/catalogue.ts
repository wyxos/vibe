import catalogue from './catalogue.generated.json'
import type { ShowcaseItem } from './fixtures'

export interface MediaCredit {
  author: string
  license: string
  licenseUrl: string
  originalTitle: string
  sourceUrl: string
  changes: string
}

export function licensedShowcaseItems(): ShowcaseItem[] {
  return catalogue.map((asset) => {
    const kind = asset.kind as 'image' | 'video' | 'audio'
    const src = `${import.meta.env.BASE_URL}media/${asset.file}`
    const width = asset.width ?? null
    const height = asset.height ?? null
    return {
      postId: `commons-${asset.id}`, mediaId: `commons-${asset.id}`, src,
      type: kind, kind, width, height, items: [],
      title: asset.title.replaceAll('_', ' '), collection: asset.collection,
      palette: '#152e4a', description: asset.credit.originalTitle,
      credit: asset.credit,
      ...(kind === 'audio'
        ? { preview: { src: `${import.meta.env.BASE_URL}media/catalogue/${asset.id}-cover.png`, width: 640, height: 640, type: 'image' as const } }
        : { preview: { src, width, height, type: kind } }),
    }
  })
}

export function interleave<T>(left: T[], right: T[]): T[] {
  return Array.from({ length: Math.max(left.length, right.length) }, (_, index) =>
    [left[index], right[index]].filter((item): item is T => item !== undefined)).flat()
}
