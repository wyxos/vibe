import { randomUUID } from 'node:crypto'
import { mkdir, readdir, rmdir } from 'node:fs/promises'
import { resolve } from 'node:path'

export async function lockSelection(directory: string): Promise<() => Promise<void>> {
  await mkdir(directory, { recursive: true })
  const name = `${process.pid}-${randomUUID()}`
  const ownLock = resolve(directory, name)
  await mkdir(ownLock)
  const release = () => rmdir(ownLock)
  try {
    // Every writer publishes its intent before checking for other writers.
    // Concurrent contenders may both retry, but cannot both enter the write.
    for (const entry of await readdir(directory)) {
      if (entry === name) continue
      const pid = Number(entry.split('-')[0])
      if (!Number.isSafeInteger(pid) || pid <= 0) throw new Error('Invalid selection lock')
      try {
        process.kill(pid, 0)
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== 'ESRCH') throw error
        // Only remove locks whose owning process has exited. No polling.
        await rmdir(resolve(directory, entry)).catch((error: NodeJS.ErrnoException) => {
          if (error.code !== 'ENOENT') throw error
        })
        continue
      }
      throw new Error('Another selection save is in progress')
    }
    return release
  } catch (error) {
    await release()
    throw error
  }
}
