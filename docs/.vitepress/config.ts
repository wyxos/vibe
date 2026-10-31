import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'Vibe',
  description: 'An initializable Vue 3 media feed with masonry and reel layouts.',
  base: '/docs/',
  cleanUrls: true,
  outDir: '../dist/docs',
  head: [
    ['link', { rel: 'icon', href: '/docs/logo.svg', type: 'image/svg+xml' }],
    ['meta', { name: 'theme-color', content: '#080808' }],
  ],
  themeConfig: {
    nav: [
      { text: 'Guide', link: '/' },
      { text: 'API', link: '/reference/configuration' },
      { text: 'Demo', link: 'https://vibe.wyxos.com/' },
    ],
    logo: {
      light: '/logo-light.svg',
      dark: '/logo-dark.svg',
    },
    search: {
      provider: 'local',
    },
    sidebar: [
      {
        text: 'Guide',
        items: [
          { text: 'Getting started', link: '/' },
          { text: 'Items and media', link: '/guide/items-and-media' },
          { text: 'Layouts', link: '/guide/layouts' },
          { text: 'Loading data', link: '/guide/loading-data' },
        ],
      },
      {
        text: 'API reference',
        items: [
          { text: 'Configuration', link: '/reference/configuration' },
          { text: 'Instance methods', link: '/reference/instance' },
        ],
      },
    ],
    socialLinks: [
      { icon: 'github', link: 'https://github.com/wyxos/vibe' },
    ],
    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © Wyxos',
    },
  },
})
