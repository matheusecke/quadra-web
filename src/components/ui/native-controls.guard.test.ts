import { describe, it, expect } from 'vitest'
import { readdirSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const src = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
/** The primitives are the only place allowed to hold a native control. */
const allowed = path.join(src, 'components', 'ui')

const tsxFiles = (dir: string): string[] =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) return full.startsWith(allowed) ? [] : tsxFiles(full)
    return entry.name.endsWith('.tsx') ? [full] : []
  })

const controls = [
  { pattern: /<select[\s>]/, primitive: 'Combobox' },
  // Separate native <input> elements from the type prop consumed by our primitives.
  // ponytail: multiline tags or object literals beyond one } need a parser-backed guard.
  { pattern: /<input\b[^>]*\btype=["']number["']|inputProps=\{\{[^}]*\btype:\s*["']number["']/, primitive: 'NumberField' },
  { pattern: /<input\b[^>]*\btype=["'](date|time|datetime-local)["']|inputProps=\{\{[^}]*\btype:\s*["'](date|time|datetime-local)["']/, primitive: 'DateTimeField' },
]

describe('native interactive controls', () => {
  it.each(controls)('is never used raw outside the design system: $primitive', ({ pattern, primitive }) => {
    const offenders = tsxFiles(src)
      .filter((file) => pattern.test(readFileSync(file, 'utf8')))
      .map((file) => path.relative(src, file))

    expect(
      offenders,
      `Use the ${primitive} primitive from src/components/ui (docs/design-system/interactive-controls.md).`,
    ).toEqual([])
  })
})

const cssFiles = (dir: string): string[] =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) return cssFiles(full)
    return entry.name.endsWith('.css') ? [full] : []
  })

/** The rule lives in scrollbar.css. The Sidebar hides its own documented exception. */
const SCROLLBAR_OWNERS = ['design-system/scrollbar.css', 'components/Sidebar.module.css']

describe('scrollbar styling', () => {
  it('is declared in exactly one place, plus the documented Sidebar exception', () => {
    const offenders = cssFiles(src)
      .filter((file) => /scrollbar-width|::-webkit-scrollbar/.test(readFileSync(file, 'utf8')))
      .map((file) => path.relative(src, file))
      .filter((file) => !SCROLLBAR_OWNERS.includes(file))

    expect(
      offenders,
      'The Quadra scrollbar is global (src/design-system/scrollbar.css). Do not redeclare it per page.',
    ).toEqual([])
  })
})
