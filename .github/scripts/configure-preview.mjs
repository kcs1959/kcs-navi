import { readFileSync, writeFileSync } from 'node:fs'

const previewName = process.env.PREVIEW_NAME
const subdomain = process.env.CLOUDFLARE_WORKERS_SUBDOMAIN
const databaseId = process.env.CLOUDFLARE_PREVIEW_D1_DATABASE_ID

if (!previewName || !/^[a-z][a-z0-9-]*$/.test(previewName)) {
  throw new Error('PREVIEW_NAME must be a lowercase DNS-compatible name')
}
if (!subdomain || !/^[a-z0-9-]+$/.test(subdomain)) {
  throw new Error('Set CLOUDFLARE_WORKERS_SUBDOMAIN to the workers.dev account subdomain')
}
if (!databaseId || !/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(databaseId)) {
  throw new Error('Set CLOUDFLARE_PREVIEW_D1_DATABASE_ID to the staging D1 database UUID')
}

const config = readFileSync('wrangler.jsonc', 'utf8').trimEnd()
const workerName = config.match(/^\s*"name"\s*:\s*"([a-z0-9-]+)"/m)?.[1]
if (!workerName || previewName.length + workerName.length + 1 > 63) {
  throw new Error('Invalid Worker name or Preview URL exceeds DNS label length limit')
}
if (!config.endsWith('}') || /"previews"\s*:/.test(config)) {
  throw new Error('Expected a Wrangler config without an existing previews block')
}

const previewUrl = `https://${previewName}-${workerName}.${subdomain}.workers.dev`
const previews = {
  vars: { NUXT_PUBLIC_SITE_URL: previewUrl },
  d1_databases: [
    {
      binding: 'DB',
      database_name: 'kcs-navi-preview',
      database_id: databaseId,
      migrations_dir: 'migrations',
    },
  ],
}

// Write a separate config in the repo root so main/assets paths still resolve.
const output = `${config.slice(0, -1).trimEnd()},\n  "previews": ${JSON.stringify(previews, null, 2)}\n}\n`
writeFileSync('wrangler.preview.jsonc', output, { mode: 0o600 })
process.stdout.write(`${previewUrl}\n`)
