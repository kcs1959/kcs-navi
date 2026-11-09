import { createHash } from 'node:crypto'

const branch = process.argv[2]
if (!branch) {
  throw new Error('A branch name is required')
}

// Keep the readable prefix short, and use a hash to avoid slug collisions.
const slug = branch
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '')
  .slice(0, 30)
  .replace(/-+$/g, '') || 'branch'
const hash = createHash('sha256').update(branch).digest('hex').slice(0, 8)
process.stdout.write(`branch-${slug}-${hash}\n`)
