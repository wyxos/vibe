import { readdir, readFile, writeFile } from 'node:fs/promises'

const fixtureDirectory = new URL('../public/data/civitai/images/', import.meta.url)
const statuses = [401, 403, 404, 419, 500]
let randomState = 0x51be

function randomInteger(maximum) {
  randomState = (Math.imul(randomState, 1664525) + 1013904223) >>> 0

  return randomState % maximum
}

function errorFixture(page, index, status) {
  const pageLabel = String(page).padStart(2, '0')

  return {
    id: 900_000_000 + page * 10 + index,
    url: `/demo-errors/${status}/page-${pageLabel}-${index + 1}.jpg`,
    hash: null,
    width: 960,
    height: index % 2 === 0 ? 1280 : 720,
    nsfwLevel: 'None',
    type: 'image',
    nsfw: false,
    browsingLevel: 1,
    createdAt: '2026-07-13T00:00:00.000Z',
    postId: 910_000_000 + page * 10 + index,
    stats: {
      cryCount: 0,
      laughCount: 0,
      likeCount: 0,
      dislikeCount: 0,
      heartCount: 0,
      commentCount: 0,
    },
    meta: null,
    username: 'Vibe error fixture',
    baseModel: null,
    modelVersionIds: [],
  }
}

const filenames = (await readdir(fixtureDirectory))
  .filter((filename) => /^page-\d{2}\.json$/.test(filename))
  .sort()

for (const filename of filenames) {
  const page = Number(filename.match(/\d{2}/)?.[0])
  const fileUrl = new URL(filename, fixtureDirectory)
  const fixture = JSON.parse(await readFile(fileUrl, 'utf8'))
  const originalItems = fixture.items.filter((item) => (
    !String(item.url).startsWith('/demo-errors/')
  ))
  const errorCount = 1 + randomInteger(3)
  const errorItems = Array.from({ length: errorCount }, (_, index) => (
    errorFixture(page, index, statuses[(page - 1 + index * 2) % statuses.length])
  ))

  fixture.items = [...errorItems, ...originalItems]
  await writeFile(fileUrl, `${JSON.stringify(fixture)}\n`)

  console.log(`${filename}: ${errorCount} error fixture${errorCount === 1 ? '' : 's'}`)
}
