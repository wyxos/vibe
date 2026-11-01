import assert from 'node:assert/strict'
import { createServer } from 'node:net'
import { once } from 'node:events'
import { test } from 'node:test'

import { parseDevOptions, startDevServers } from './dev.mjs'

test('accepts standard, npm-consumed and environment port options', () => {
  assert.equal(parseDevOptions([], {}).port, 5173)
  assert.equal(parseDevOptions(['--port', '5175'], {}).port, 5175)
  assert.equal(parseDevOptions(['--port=5176'], {}).port, 5176)
  assert.equal(parseDevOptions(['5175'], { npm_config_port: 'true' }).port, 5175)
  assert.equal(parseDevOptions([], { npm_config_port: '5177' }).port, 5177)
  for (const args of [['--port'], ['--port', '65535'], ['--port', '0'], ['--port', 'bad']]) {
    assert.throws(() => parseDevOptions(args, {}), /demo port/)
  }
  assert.throws(() => parseDevOptions(['--unknown'], {}), /Unknown option/)
})

test('busy demo and docs ports fall back and docs proxy reaches the bound port', async () => {
  const blockers = []
  let servers
  try {
    const first = createServer()
    blockers.push(first)
    first.listen(0, '127.0.0.1')
    await once(first, 'listening')
    const port = first.address().port
    const second = createServer()
    blockers.push(second)
    second.listen(port + 1, '127.0.0.1')
    await once(second, 'listening')
    servers = await startDevServers({ host: '127.0.0.1', port })
    const demoPort = servers.demo.httpServer.address().port
    const docsPort = servers.docs.httpServer.address().port
    assert.notEqual(demoPort, port)
    assert.notEqual(docsPort, port + 1)
    assert.notEqual(demoPort, docsPort)
    const response = await fetch(`http://127.0.0.1:${demoPort}/docs/`)
    assert.equal(response.status, 200)
    assert.match(await response.text(), /vitepress.*client.*app\/index\.js/)
  }
  finally {
    await servers?.close()
    await Promise.all(blockers.map((server) => new Promise((resolve) => server.close(resolve))))
  }
})
