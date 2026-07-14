import { gzipSync } from 'node:zlib'
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises'
import { dirname, extname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const dist = join(root, 'dist')
const baselinePath = join(root, 'budgets', 'baseline.json')
const writeBaseline = process.argv.includes('--write-baseline')

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true })
  const files = []
  for (const entry of entries) {
    const path = join(directory, entry.name)
    if (entry.isDirectory()) files.push(...await walk(path))
    else files.push(path)
  }
  return files
}

const assets = (await walk(dist))
  .filter(path => ['.js', '.css'].includes(extname(path)))
  .sort()

const files = await Promise.all(assets.map(async path => {
  const content = await readFile(path)
  return {
    path: relative(root, path).replaceAll('\\', '/'),
    type: extname(path).slice(1),
    bytes: content.byteLength,
    gzipBytes: gzipSync(content, { level: 9 }).byteLength,
  }
}))

const totals = files.reduce((current, file) => {
  current[file.type].bytes += file.bytes
  current[file.type].gzipBytes += file.gzipBytes
  return current
}, {
  js: { bytes: 0, gzipBytes: 0 },
  css: { bytes: 0, gzipBytes: 0 },
})

const report = {
  schemaVersion: 1,
  projectVersion: '1.1.0',
  generatedBy: 'npm run build && node scripts/report-bundle.mjs',
  reviewThresholds: {
    javascriptPercent: 15,
    cssPercent: 20,
  },
  totals,
  files,
}

console.log(JSON.stringify(report, null, 2))

if (writeBaseline) {
  await mkdir(dirname(baselinePath), { recursive: true })
  await writeFile(baselinePath, `${JSON.stringify(report, null, 2)}\n`)
  console.log(`Wrote ${relative(root, baselinePath)}`)
} else {
  try {
    const baseline = JSON.parse(await readFile(baselinePath, 'utf8'))
    for (const type of ['js', 'css']) {
      const before = baseline.totals[type].bytes
      const after = totals[type].bytes
      const change = before === 0 ? 0 : ((after - before) / before) * 100
      console.log(`${type.toUpperCase()} raw change from baseline: ${change.toFixed(2)}%`)
    }
  } catch (error) {
    if (error?.code !== 'ENOENT') throw error
    console.log('No committed baseline exists yet. Run with --write-baseline after a clean production build.')
  }
}
