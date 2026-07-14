import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const theme = readFileSync(
  path.join(path.dirname(fileURLToPath(import.meta.url)), 'theme.css'),
  'utf8',
)

describe('theme.css', () => {
  it('tells the browser which scheme to paint its own widgets in — light', () => {
    expect(theme).toMatch(/:root\s*{[^}]*color-scheme:\s*light/s)
  })

  it('tells the browser which scheme to paint its own widgets in — dark', () => {
    expect(theme).toMatch(/html\[data-theme="dark"\]\s*{[^}]*color-scheme:\s*dark/s)
  })
})
