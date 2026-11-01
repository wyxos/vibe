#!/usr/bin/env node

import { fileURLToPath } from 'node:url'
import { resolve } from 'node:path'

export function parseDevOptions(args, env = process.env) {
  let port = env.npm_config_port ?? 5173
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index]
    if (arg === '--port') port = args[++index]
    else if (arg.startsWith('--port=')) port = arg.slice('--port='.length)
    // npm consumes --port itself in `npm run dev --port 5175`.
    else if (/^\d+$/.test(arg)) port = arg
    else throw new Error(`Unknown option ${arg}. Use npm run dev -- --port 5175.`)
  }
  const number = Number(port)
  if (!Number.isInteger(number) || number < 1 || number > 65534) {
    throw new Error('The demo port must be an integer between 1 and 65534.')
  }
  return { host: '127.0.0.1', port: number }
}

export async function startDevServers(options = parseDevOptions([])) {
  const [{ createServer }, { createServer: createDocsServer }] = await Promise.all([
    import('vite'),
    import('vitepress'),
  ])
  const root = fileURLToPath(new URL('../', import.meta.url))
  let docs
  let demo
  let closing = false
  const close = async () => {
    if (closing) return
    closing = true
    await Promise.allSettled([demo?.close(), docs?.close()])
  }
  const startDocs = async (port) => {
    docs = await createDocsServer(resolve(root, 'docs'), {
      host: options.host, port, strictPort: false,
    }, async () => {
      const activePort = docs.httpServer.address().port
      await docs.close()
      if (!closing) {
        await startDocs(activePort)
        demo?.ws.send({ type: 'full-reload', path: '/docs/*' })
      }
    })
    await docs.listen()
  }
  try {
    // Start docs first so the proxy uses its actual bound port, including fallback.
    await startDocs(options.port + 1)
    const docsPort = docs.httpServer.address().port
    demo = await createServer({
      root,
      server: {
        host: options.host, port: options.port, strictPort: false,
        proxy: { '/docs': { target: `http://${options.host}:${docsPort}` } },
      },
    })
    await demo.listen()
    return { demo, docs, close }
  }
  catch (error) {
    await close()
    throw error
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  let servers
  const shutdown = async () => {
    await servers?.close()
    process.exit()
  }
  process.once('SIGINT', shutdown)
  process.once('SIGTERM', shutdown)
  try {
    servers = await startDevServers(parseDevOptions(process.argv.slice(2)))
    console.log('\nDemo:')
    servers.demo.printUrls()
    console.log('Docs:')
    servers.docs.printUrls()
  }
  catch (error) {
    console.error(error instanceof Error ? error.message : error)
    process.exitCode = 1
  }
}
