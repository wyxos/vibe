import type { VibeViewerItem } from '@/components/vibeViewer'

const T_REX_ROAR_AUDIO_URL = 'https://interactive-examples.mdn.mozilla.net/media/cc0-audio/t-rex-roar.mp3'
const KALIMBA_AUDIO_URL = 'https://www.learningcontainer.com/wp-content/uploads/2020/02/Kalimba.mp3'

export const fakeMediaFileItems: VibeViewerItem[] = [
  {
    id: 'audio-voiceover-cut',
    type: 'audio',
    title: 'Voiceover rough cut',
    url: KALIMBA_AUDIO_URL,
    preview: {
      url: KALIMBA_AUDIO_URL,
    },
  },
  {
    id: 'doc-brand-guidelines',
    type: 'document',
    title: 'Brand guidelines',
    url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    preview: {
      url: 'https://picsum.photos/id/1033/600/800',
      width: 600,
      height: 800,
    },
  },
  {
    id: 'archive-release-assets',
    type: 'archive',
    title: 'Release assets bundle',
    url: 'https://example.com/files/release-assets-v03.zip',
  },
  {
    id: 'other-scene-model',
    type: 'other',
    title: 'Trade-show booth model',
    url: 'https://example.com/files/trade-show-booth.glb',
  },
  {
    id: 'audio-field-recording',
    type: 'audio',
    title: 'Field recording ambience',
    url: KALIMBA_AUDIO_URL,
    preview: {
      url: KALIMBA_AUDIO_URL,
    },
  },
  {
    id: 'doc-q2-roadmap',
    type: 'document',
    title: 'Q2 roadmap draft',
    url: 'https://example.com/files/q2-roadmap-draft.pptx',
    preview: {
      url: 'https://picsum.photos/id/1050/640/360',
      width: 640,
      height: 360,
    },
  },
  {
    id: 'other-dataset-export',
    type: 'other',
    title: 'Analytics export',
    url: 'https://example.com/files/analytics-export.json',
  },
  {
    id: 'audio-notification-pack',
    type: 'audio',
    title: 'Notification pack',
    url: T_REX_ROAR_AUDIO_URL,
    preview: {
      url: T_REX_ROAR_AUDIO_URL,
    },
  },
  {
    id: 'doc-legal-brief',
    type: 'document',
    title: 'Vendor legal brief',
    url: 'https://example.com/files/vendor-legal-brief.docx',
  },
  {
    id: 'archive-caption-bundle',
    type: 'archive',
    title: 'Caption exports',
    url: 'https://example.com/files/caption-exports.tar',
  },
  {
    id: 'other-copy-deck',
    type: 'other',
    title: 'Campaign copy deck',
    url: 'https://example.com/files/campaign-copy-deck.md',
  },
  {
    id: 'audio-podcast-note',
    type: 'audio',
    title: 'Podcast chapter note',
    url: KALIMBA_AUDIO_URL,
    preview: {
      url: KALIMBA_AUDIO_URL,
    },
  },
]
