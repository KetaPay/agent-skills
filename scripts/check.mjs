// Checks the skills against the Agent Skills format and against the API:
//   - frontmatter: name matches its folder (lowercase-hyphen, at most 64), description 50-1024 characters
//   - SKILL.md under 500 lines; every relative link (references/...) exists, one level deep
//   - at least one docs.ketapay.com link per skill; with --links, every docs link answers 200
//   - spec/v1.yaml was not edited by hand, and the references cover every operation, event type, error code
//     and scope in it, so a new API feature can't ship without the skills knowing about it
import { createHash } from 'node:crypto'
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { parse } from 'yaml'

const checkLinks = process.argv.includes('--links')
const errors = []
const docsLinks = new Set()
const skills = readdirSync('skills')

for (const dir of skills) {
  const path = join('skills', dir, 'SKILL.md')
  const text = readFileSync(path, 'utf8')
  const fm = text.match(/^---\n([\s\S]*?)\n---\n/)
  if (!fm) {
    errors.push(`${dir}: no frontmatter`)
    continue
  }
  const field = (k) => fm[1].match(new RegExp(`^${k}: (.+)$`, 'm'))?.[1]
  const name = field('name') ?? ''
  const description = field('description') ?? ''
  if (name !== dir) errors.push(`${dir}: name "${name}" does not match the folder`)
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(name) || name.length > 64) errors.push(`${dir}: bad name`)
  if (description.length < 50 || description.length > 1024) errors.push(`${dir}: description must be 50-1024 characters`)
  if (text.split('\n').length >= 500) errors.push(`${dir}: SKILL.md must stay under 500 lines`)

  for (const [, link] of text.matchAll(/\]\(((?!https?:)[^)]+)\)/g)) {
    if (link.split('/').length > 2) errors.push(`${dir}: ${link} is more than one level deep`)
    if (!existsSync(join('skills', dir, link))) errors.push(`${dir}: ${link} does not exist`)
  }
  const files = [text, ...listRefs(dir).map((f) => readFileSync(f, 'utf8'))].join('\n')
  const found = [...files.matchAll(/https:\/\/docs\.ketapay\.com\/[\w\-/]+/g)].map((m) => m[0])
  if (!found.length) errors.push(`${dir}: links no docs page`)
  found.forEach((l) => docsLinks.add(l))
}

// The spec: hash, then coverage
const raw = readFileSync('spec/v1.yaml', 'utf8')
const [, recorded, body] = raw.match(/^# GENERATED.*\n# sha256: (\w+)\n\n([\s\S]*)$/) ?? []
if (!body || createHash('sha256').update(body).digest('hex') !== recorded) errors.push('spec/v1.yaml was edited by hand: run npm run sync-spec')
const spec = parse(body ?? raw)
const ops = Object.values(spec.paths).flatMap((p) => Object.values(p).filter((o) => o?.operationId))
const ref = (f) => readFileSync(join('skills', f), 'utf8')
const cover = (what, items, file) => {
  const text = ref(file)
  for (const item of new Set(items)) if (!text.includes(`\`${item}\``)) errors.push(`${file}: missing ${what} \`${item}\``)
}
cover('operation', ops.map((o) => o.operationId), 'ketapay-setup/references/endpoints.md')
cover('scope', ops.map((o) => o['x-required-scope']).filter(Boolean), 'ketapay-setup/references/scopes.md')
cover('event type', spec.components.schemas.EventType.enum, 'ketapay-webhooks/references/events.md')
const codes = spec.components.schemas.Error.properties.error.properties.code.description
cover('error code', [...codes.matchAll(/`([a-z_]+)`/g)].map((m) => m[1]), 'ketapay-money-safety/references/errors.md')

if (checkLinks) {
  for (const link of docsLinks) {
    const res = await fetch(link, { method: 'HEAD', redirect: 'follow' }).catch(() => null)
    if (res?.status !== 200) errors.push(`${link}: answered ${res?.status ?? 'nothing'}`)
  }
}

if (errors.length) {
  console.error(errors.join('\n'))
  process.exit(1)
}
console.log(`${skills.length} skills OK; ${ops.length} operations covered${checkLinks ? `; ${docsLinks.size} docs links answer` : ''}`)

function listRefs(dir) {
  const refs = join('skills', dir, 'references')
  return existsSync(refs) ? readdirSync(refs).map((f) => join(refs, f)) : []
}
