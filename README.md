# @wyxos/vibe

VIBE (Vue Infinite Block Engine) is a high-performance masonry feed component for Vue 3.

It’s built for large, scroll-heavy media feeds and aims to stay smooth with thousands of items.

## Highlights

- Virtualized rendering (keeps DOM small)
- Infinite loading via an async `getContent(pageToken) => { items, nextPage }`
- Optional backfill mode to reach a target `pageSize`
- Smooth removal + reorder transitions, with `remove` / `undo` / `restore`
- Preserves a single DOM sequence (no column re-parenting)
- Optional `itemHeader` / `itemFooter` slots per card

## Demo

- Local: `npm run dev`
- Live: https://vibe.wyxos.com/

## Install

```bash
npm i @wyxos/vibe
```
## Local library build

- JS bundles: `npm run build:lib`
- Types: `npm run build:types`
