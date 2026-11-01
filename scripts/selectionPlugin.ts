import { mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import type { Plugin } from 'vite'
import { lockSelection } from './selectionLock'

export const csvHeader = 'civitai_image_id,civitai_post_id\r\n'

export function selectionPlugin(): Plugin {
  return {
    name: 'vibe-example-selection',
    configureServer(server) {
      const directory = resolve(server.config.root, '.vibe-selection.local')
      const destination = resolve(directory, 'selected-civitai.csv')
      let queue = Promise.resolve()
      const loadDataset = () => Promise.all(Array.from({ length: 10 }, async (_, index) => {
        const page = String(index + 1).padStart(2, '0')
        const fixture = JSON.parse(await readFile(resolve(
          server.config.root, `public/data/civitai/images/page-${page}.json`,
        ), 'utf8')) as { items: { id: number; postId: number }[] }
        return fixture.items
      })).then((pages) => pages.flat())

      server.middlewares.use('/__selection', (request, response) => {
        response.setHeader('Cache-Control', 'no-store')
        const job = queue.then(async () => {
          let release: (() => Promise<void>) | undefined
          try {
            if (request.method === 'POST') {
              await mkdir(directory, { recursive: true })
              try {
                release = await lockSelection(`${destination}.locks`)
              } catch {
                response.statusCode = 409
                response.end('Another save is in progress. Please retry.')
                return
              }
            }
            let csv = csvHeader
            try { csv = await readFile(destination, 'utf8') }
            catch (error) {
              if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error
            }
            const rows = csv.trim().split(/\r?\n/).slice(1).map((line) => {
              const [imageId, postId] = line.split(',').map(Number)
              if (!Number.isSafeInteger(imageId) || !Number.isSafeInteger(postId)) {
                throw new Error('Invalid selection file')
              }
              return { imageId: imageId!, postId: postId! }
            })
            if (request.method === 'POST') {
              // Reject cross-origin writes and accept only small, explicit JSON actions.
              if (request.headers.origin && request.headers.origin !== `http://${request.headers.host}`) {
                response.statusCode = 403
                response.end()
                return
              }
              let body = ''
              for await (const chunk of request) {
                body += chunk
                if (body.length > 1024) throw new Error('Selection request too large')
              }
              const action = JSON.parse(body) as { postId?: unknown; selected?: unknown }
              const images = (await loadDataset()).filter((image) => image.postId === action.postId)
              if (!images.length || typeof action.selected !== 'boolean') {
                response.statusCode = 400
                response.end('Invalid selection')
                return
              }
              const retained = rows.filter((row) => row.postId !== action.postId)
              if (action.selected) {
                const ids = new Set(images.map((image) => image.id))
                retained.push(...[...ids].map((imageId) => ({ imageId, postId: action.postId as number })))
              }
              csv = csvHeader + retained.map((row) => `${row.imageId},${row.postId}\r\n`).join('')
              await mkdir(directory, { recursive: true })
              await writeFile(`${destination}.tmp`, csv, 'utf8')
              await rename(`${destination}.tmp`, destination)
              rows.splice(0, rows.length, ...retained)
            } else if (request.method !== 'GET') {
              response.statusCode = 405
              response.end()
              return
            }
            if (request.url === '/csv') {
              response.setHeader('Content-Type', 'text/csv; charset=utf-8')
              response.setHeader('Content-Disposition', 'attachment; filename="selected-civitai.csv"')
              response.end(csv)
            } else {
              response.setHeader('Content-Type', 'application/json')
              response.end(JSON.stringify(rows))
            }
          } finally {
            await release?.()
          }
        })
        queue = job.catch(() => {
          response.statusCode = 500
          response.end('Could not read or save selections. Please retry.')
        })
      })
    },
  }
}
