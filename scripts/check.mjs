// Checks every skill: frontmatter in the Agent Skills format (name matches its folder, lowercase-hyphen,
// description under 1024 characters), at least one docs.ketapay.com link, and (unless --offline) that each
// docs link answers 200.
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const offline = process.argv.includes('--offline')
const errors = []
const links = new Set()

for (const dir of readdirSync('skills')) {
  const text = readFileSync(join('skills', dir, 'SKILL.md'), 'utf8')
  const fm = text.match(/^---\n([\s\S]*?)\n---\n/)
  if (!fm) {
    errors.push(`${dir}: no frontmatter`)
    continue
  }
  const field = (k) => fm[1].match(new RegExp(`^${k}: (.+)$`, 'm'))?.[1]
  const name = field('name')
  const description = field('description') ?? ''
  if (name !== dir) errors.push(`${dir}: name "${name}" does not match the folder`)
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(name ?? '') || name.length > 64) errors.push(`${dir}: bad name`)
  if (description.length < 50 || description.length > 1024) errors.push(`${dir}: description must be 50-1024 characters`)
  const found = [...text.matchAll(/https:\/\/docs\.ketapay\.com\/[\w\-/]+/g)].map((m) => m[0])
  if (found.length === 0) errors.push(`${dir}: links no docs page`)
  found.forEach((l) => links.add(l))
}

if (!offline) {
  for (const link of links) {
    const res = await fetch(link, { method: 'HEAD', redirect: 'follow' }).catch(() => null)
    if (res?.status !== 200) errors.push(`${link}: answered ${res?.status ?? 'nothing'}`)
  }
}

if (errors.length) {
  console.error(errors.join('\n'))
  process.exit(1)
}
console.log(`${readdirSync('skills').length} skills OK${offline ? '' : `, ${links.size} docs links answer`}`)
