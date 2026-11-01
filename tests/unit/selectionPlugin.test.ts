import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'
import { createServer } from 'vite'
import { expect, it } from 'vitest'
import { selectionPlugin } from '../../scripts/selectionPlugin'
import { lockSelection } from '../../scripts/selectionLock'
import { spawnSync } from 'node:child_process'

it('persists every post image across pages, deduplicates, resumes and undoes', async () => {
  const root = await mkdtemp(resolve(tmpdir(), 'vibe-selection-'))
  await mkdir(resolve(root, 'public/data/civitai/images'), { recursive: true })
  for (let index = 1; index <= 10; index++) {
    await writeFile(resolve(root, `public/data/civitai/images/page-${String(index).padStart(2, '0')}.json`), JSON.stringify({
      items: index <= 2 ? [{ id: index, postId: 50 }] : [],
    }))
  }
  const server = await createServer({
    root, configFile: false, plugins: [selectionPlugin()],
    server: { host: '127.0.0.1', port: 0 },
  })
  try {
    await server.listen()
    const address = server.httpServer!.address() as { port: number }
    const url = `http://127.0.0.1:${address.port}/__selection`
    const select = (selected: boolean) => fetch(url, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ postId: 50, selected }),
    })
    expect(await (await fetch(url)).json()).toEqual([])
    expect(await (await select(true)).json()).toHaveLength(2)
    await select(true)
    const expected = 'civitai_image_id,civitai_post_id\r\n1,50\r\n2,50\r\n'
    expect(await readFile(resolve(root, '.vibe-selection.local/selected-civitai.csv'), 'utf8')).toBe(expected)
    expect(await (await fetch(`${url}/csv`)).text()).toBe(expected)
    expect(await (await fetch(url)).json()).toHaveLength(2)
    const rejected = await fetch(url, {
      method: 'POST', headers: { Origin: 'https://other.example' },
      body: JSON.stringify({ postId: 50, selected: false }),
    })
    expect(rejected.status).toBe(403)
    expect(await (await select(false)).json()).toEqual([])
    expect(await readFile(resolve(root, '.vibe-selection.local/selected-civitai.csv'), 'utf8'))
      .toBe('civitai_image_id,civitai_post_id\r\n')
  } finally {
    await server.close()
    await rm(root, { recursive: true, force: true })
  }
})

it('rejects overlapping writers and recovers locks left by an exited process', async () => {
  const root = await mkdtemp(resolve(tmpdir(), 'vibe-selection-lock-'))
  try {
    const deadProcess = spawnSync(process.execPath, ['-e', ''])
    expect(deadProcess.status).toBe(0)
    await mkdir(resolve(root, `${deadProcess.pid}-interrupted`))
    const release = await lockSelection(root)
    await expect(lockSelection(root)).rejects.toThrow('Another selection save')
    await release()
    await (await lockSelection(root))()
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})
