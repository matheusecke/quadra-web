/// <reference types="node" />

import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const css = readFileSync(
  join(process.cwd(), 'src/pages/matches/matches.module.css'),
  'utf8',
)

function ruleFor(selector: string) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const match = css.match(new RegExp(`${escaped}\\s*\\{([^}]*)\\}`))
  return match?.[1] ?? ''
}

describe('match stats layout styles', () => {
  it('keeps the centered stats area width stable when switching teams', () => {
    expect(ruleFor('.statsShell')).toContain('width: min(100%, 1040px)')
    expect(ruleFor('.statsShell')).not.toContain('fit-content')
    expect(ruleFor('.boxTable')).not.toContain('max-content')
  })
})
