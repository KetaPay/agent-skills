// Copies the bundled public spec from the documentation repo (its source of truth) into spec/ with a hash,
// so `npm test` can check the references cover every operation, event, error code and scope.
// Usage: npm run sync-spec [-- <documentation>/openapi/public]
import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const dir = process.argv[2] ?? '../documentation/openapi/public'
const body = readFileSync(join(dir, 'dist/v1.yaml'), 'utf8')
const sha = createHash('sha256').update(body).digest('hex')
writeFileSync('spec/v1.yaml', `# GENERATED: do not edit. Copied from documentation/openapi/public by \`npm run sync-spec\`.\n# sha256: ${sha}\n\n${body}`)
console.log(`Copied ${join(dir, 'dist/v1.yaml')} -> spec/v1.yaml`)
