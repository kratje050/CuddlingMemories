import { createClient } from '@supabase/supabase-js'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

const TABLES = [
  'page_sections',
  'portfolio_albums',
  'portfolio_photos',
  'public_image_publish_jobs',
  'public_image_assets',
  'client_galleries',
  'gallery_photos',
  'mini_sessions',
]

const IMAGE_FIELDS = [
  'image_url',
  'thumbnail_url',
  'image_srcset',
  'cover_image_url',
  'primary_path',
  'srcset',
  'public_base_url',
  'public_paths',
  'repo_paths',
  'variants',
  'image_variants',
]

const BUCKETS = ['portfolio', 'client-galleries']
const PAGE_SIZE = 1000

function parseEnv(content) {
  return Object.fromEntries(
    content
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith('#') && line.includes('='))
      .map((line) => {
        const separator = line.indexOf('=')
        return [line.slice(0, separator).trim(), line.slice(separator + 1).trim()]
      }),
  )
}

async function loadLocalEnv() {
  try {
    return parseEnv(await readFile('.env', 'utf8'))
  } catch {
    return {}
  }
}

async function fetchAllRows(supabase, table) {
  const rows = []

  for (let start = 0; ; start += PAGE_SIZE) {
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .range(start, start + PAGE_SIZE - 1)

    if (error) throw error
    rows.push(...(data || []))
    if (!data || data.length < PAGE_SIZE) break
  }

  return rows
}

async function listStorageFolder(supabase, bucket, prefix = '') {
  const items = []

  for (let offset = 0; ; offset += PAGE_SIZE) {
    const { data, error } = await supabase.storage.from(bucket).list(prefix, {
      limit: PAGE_SIZE,
      offset,
      sortBy: { column: 'name', order: 'asc' },
    })

    if (error) throw error
    const page = data || []

    for (const item of page) {
      const path = prefix ? `${prefix}/${item.name}` : item.name
      if (item.id) {
        items.push({ ...item, path })
      } else {
        items.push(...(await listStorageFolder(supabase, bucket, path)))
      }
    }

    if (page.length < PAGE_SIZE) break
  }

  return items
}

function buildImageMap(tableData) {
  const records = []

  for (const [table, rows] of Object.entries(tableData)) {
    for (const row of rows) {
      const imageData = Object.fromEntries(
        IMAGE_FIELDS.filter((field) => row[field] !== undefined && row[field] !== null)
          .map((field) => [field, row[field]]),
      )

      if (Object.keys(imageData).length > 0) {
        records.push({ table, id: row.id ?? null, ...imageData })
      }
    }
  }

  return records
}

function totalStorageBytes(items) {
  return items.reduce((total, item) => {
    const size = Number(item.metadata?.size || 0)
    return total + (Number.isFinite(size) ? size : 0)
  }, 0)
}

const localEnv = await loadLocalEnv()
const supabaseUrl = process.env.VITE_SUPABASE_URL || localEnv.VITE_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const anonKey = process.env.VITE_SUPABASE_ANON_KEY || localEnv.VITE_SUPABASE_ANON_KEY
const accessKey = serviceKey || anonKey

if (!supabaseUrl || !accessKey) {
  throw new Error('Supabase URL of sleutel ontbreekt in de veilige procesomgeving.')
}

const accessMode = serviceKey ? 'service-role' : 'anon'
const supabase = createClient(supabaseUrl, accessKey, {
  auth: { persistSession: false, autoRefreshToken: false },
})
const timestamp = new Date().toISOString().replace(/[:.]/g, '-').replace('T', '_').replace('Z', '')
const outputDir = join('backups', 'r2-migration', timestamp)
await mkdir(join(outputDir, 'tables'), { recursive: true })
await mkdir(join(outputDir, 'storage'), { recursive: true })

const tableData = {}
const tableErrors = {}
for (const table of TABLES) {
  try {
    tableData[table] = await fetchAllRows(supabase, table)
    await writeFile(join(outputDir, 'tables', `${table}.json`), JSON.stringify(tableData[table], null, 2))
  } catch (error) {
    tableData[table] = []
    tableErrors[table] = error.message
  }
}

const storageData = {}
const storageErrors = {}
for (const bucket of BUCKETS) {
  try {
    storageData[bucket] = await listStorageFolder(supabase, bucket)
    await writeFile(join(outputDir, 'storage', `${bucket}.json`), JSON.stringify(storageData[bucket], null, 2))
  } catch (error) {
    storageData[bucket] = []
    storageErrors[bucket] = error.message
  }
}

const imageMap = buildImageMap(tableData)
await writeFile(join(outputDir, 'database-image-map.json'), JSON.stringify(imageMap, null, 2))

const manifest = {
  created_at: new Date().toISOString(),
  access_mode: accessMode,
  source: 'Supabase',
  table_counts: Object.fromEntries(Object.entries(tableData).map(([table, rows]) => [table, rows.length])),
  table_errors: tableErrors,
  storage: Object.fromEntries(
    Object.entries(storageData).map(([bucket, items]) => [bucket, {
      object_count: items.length,
      total_bytes: totalStorageBytes(items),
    }]),
  ),
  storage_errors: storageErrors,
  mapped_image_records: imageMap.length,
}

await writeFile(join(outputDir, 'manifest.json'), JSON.stringify(manifest, null, 2))
await writeFile(
  join(outputDir, 'migration-log.md'),
  [
    '# R2 migration log',
    '',
    `- Created: ${manifest.created_at}`,
    `- Access mode: ${accessMode}`,
    '- No source objects were changed or deleted.',
    '- This directory may contain private customer data and must not be committed.',
    '',
    '## Next steps',
    '',
    '- Create and configure the R2 bucket.',
    '- Upload copies and verify checksums before changing database records.',
    '- Keep Supabase originals until explicit deletion approval is given.',
    '',
  ].join('\n'),
)

console.log(JSON.stringify({ outputDir, ...manifest }, null, 2))
