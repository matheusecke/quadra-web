import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const css = readFileSync(
  path.join(path.dirname(fileURLToPath(import.meta.url)), 'BracketCanvas.module.css'),
  'utf8',
)

describe('BracketCanvas.module.css', () => {
  it('does not use the theme-blind legacy --color-* tokens', () => {
    expect(css).not.toMatch(/var\(--color-/)
  })
})
