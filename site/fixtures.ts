import type { VibeItem, VibeMediaAsset } from '../src/index'
import { interleave, licensedShowcaseItems } from './catalogue'
import type { MediaCredit } from './catalogue'

export interface ShowcaseItem extends VibeItem {
  title: string
  collection: string
  kind: 'image' | 'video' | 'audio'
  palette: string
  description: string
  credit?: MediaCredit
}

const media = (file: string) => `${import.meta.env.BASE_URL}media/${file}`
function image(file: string, width: number, height: number): VibeMediaAsset {
  return {
    mediaId: `showcase-${file}`, src: media(file), type: 'image', width, height,
    preview: { src: media(file), width, height, type: 'image' },
  }
}
function artwork(id: string, title: string, collection: string, file: string,
  width: number, height: number, palette: string, description: string,
  children: VibeMediaAsset[] = []): ShowcaseItem {
  return { postId: `showcase-${id}`, ...image(file, width, height),
    title, collection, kind: 'image', palette, description, items: children }
}
function video(id: string, title: string, file: string, width: number, height: number): ShowcaseItem {
  return {
    postId: `showcase-${id}`, mediaId: `showcase-${id}-motion`, title,
    collection: 'Motion studies', kind: 'video', palette: '#284350',
    description: 'An original mathematical motion study. Six seconds, seamlessly looped, without audio.',
    src: media(file), preview: { src: media(file), width, height, type: 'video' },
    width, height, type: 'video', items: [],
  }
}
function sound(id: string, title: string, covered: boolean): ShowcaseItem {
  return {
    postId: `showcase-${id}`, mediaId: `showcase-${id}-audio`, title,
    collection: 'Sound studies', kind: 'audio', palette: '#263e3e',
    description: 'An original ten-second harmonic composition, synthesized from sine waves. No sampled recordings.',
    src: media('quiet-frequency.wav'), width: null, height: null, type: 'audio', items: [],
    ...(covered ? { preview: { src: media('quiet-frequency.svg'), width: 1000, height: 1000, type: 'image' as const } } : {}),
  }
}

const originalShowcaseItems: ShowcaseItem[] = [
  artwork('image-01', 'Solstice', 'Original studies', 'image-01.webp', 1086, 1448, '#c7b59a',
    'An original AI-generated image made for this demonstration.'),
  video('orbit', 'Chromatic orbit', 'chromatic-orbit.mp4', 576, 768),
  artwork('orbital-study', 'Orbital study', 'Geometric editions', 'orbital-study.svg', 900, 1200, '#e9e1cd',
    'A precise study of a circle, a ring and twenty-four radial marks.'),
  artwork('image-02', 'Blue hour', 'Original studies', 'image-02.webp', 1536, 1024, '#d8bb96',
    'An original AI-generated image made for this demonstration.'),
  artwork('blueprint-bloom', 'Eighteen rotations', 'Geometric editions', 'blueprint-bloom.svg', 1000, 1000, '#d8dfd5',
    'One ellipse rotated eighteen times around a shared centre.'),
  artwork('image-03', 'Quiet bloom', 'Original studies', 'image-03.webp', 1086, 1448, '#50697b',
    'An original AI-generated image made for this demonstration.'),
  sound('quiet-frequency', 'Quiet frequency', true),
  artwork('ribbon-grid', 'A line in motion', 'Geometric editions', 'ribbon-grid.svg', 1200, 900, '#121d23',
    'Twenty-four exact Bézier curves, drawn in two warm inks.'),
  artwork('image-04', 'Tidal study', 'Original studies', 'image-04.webp', 1254, 1254, '#b3a18d',
    'An original AI-generated image made for this demonstration.'),
  artwork('solar-stack', 'Solar stack', 'Geometric editions', 'solar-stack.svg', 1000, 1250, '#e75232',
    'Five intersecting circles in a restrained three-colour arrangement.'),
  video('phase', 'Phase shift', 'phase-shift.mp4', 960, 540),
  artwork('color-field', 'Intervals in colour', 'Geometric editions', 'color-field.svg', 1200, 1000, '#f0e5ce',
    'A modular colour field made from twenty squares and twenty circles.'),
  artwork('landscape-pair', 'Two studies', 'Grouped images', 'image-01.webp', 1086, 1448, '#c7b59a',
    'A grouped post pairing two original AI-generated images.', [image('image-03.webp', 1086, 1448)]),
  artwork('signal-noon', 'Signal at noon', 'Geometric editions', 'signal-noon.svg', 900, 1100, '#e5b244',
    'Thirteen displaced vertical marks and a pair of nested circles.'),
  artwork('night-index', 'Night index', 'Geometric editions', 'night-index.svg', 1200, 800, '#1a2a30',
    'Forty-two circles with a deterministic sequence of radii.'),
  sound('uncovered-audio', 'Sound, without a cover', false),
  artwork('geometric-trio', 'Three ways around', 'Grouped images', 'orbital-study.svg', 900, 1200, '#e9e1cd',
    'A three-image post demonstrating carousel navigation.',
    [image('blueprint-bloom.svg', 1000, 1000), image('solar-stack.svg', 1000, 1250)]),
  artwork('quiet-print', 'A quiet print', 'Geometric editions', 'quiet-frequency.svg', 1000, 1000, '#d6d9c4',
    'A circular signal print; also used as the cover of the original audio study.'),
]

const importedItems = licensedShowcaseItems()
const kinds = ['image', 'video', 'audio'] as const
const pools = Object.fromEntries(kinds.map((kind) => [kind, interleave(
  originalShowcaseItems.filter((item) => item.kind === kind && item.postId !== 'showcase-uncovered-audio'),
  importedItems.filter((item) => item.kind === kind),
)])) as Record<typeof kinds[number], ShowcaseItem[]>

pools.audio.push(originalShowcaseItems.find((item) => item.postId === 'showcase-uncovered-audio')!)

export const showcaseItems: ShowcaseItem[] = []
const positions = { image: 0, video: 0, audio: 0 }
while (showcaseItems.length < originalShowcaseItems.length + importedItems.length) {
  for (const kind of ['image', 'video', 'image', 'audio'] as const) {
    const item = pools[kind][positions[kind]]
    if (item) { showcaseItems.push(item); positions[kind]++ }
  }
}

// Keep a grouped post in the opening mixed page without immediately repeating
// its cover. Individual category ordering stays independent of this showcase.
const openingGroup = showcaseItems.splice(showcaseItems.findIndex((item) => item.postId === 'showcase-geometric-trio'), 1)[0]!
const repeatedCover = showcaseItems.splice(showcaseItems.findIndex((item) => item.postId === 'showcase-orbital-study'), 1)[0]!
showcaseItems.splice(4, 0, openingGroup)
showcaseItems.push(repeatedCover)

export function getShowcaseItems(filter: 'all' | 'image' | 'video' | 'audio'): ShowcaseItem[] {
  return filter === 'all' ? [...showcaseItems] : [...pools[filter]]
}
