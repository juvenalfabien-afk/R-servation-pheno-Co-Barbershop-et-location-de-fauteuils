import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const dashboard = readFileSync(new URL('../../components/AdminDashboard.tsx', import.meta.url), 'utf8')
const dashboardCss = readFileSync(new URL('../../app/admin/admin-dashboard.css', import.meta.url), 'utf8')

describe('dashboard class names remain ad-blocker safe', () => {
  it('n’utilise pas de noms génériques couramment filtrés comme publicité', () => {
    const source = `${dashboard}\n${dashboardCss}`
    expect(source).not.toMatch(/className\s*=\s*[`"']\s*(?:ad|ads|advert|advertisement|sponsor|sponsored)(?:-|_|\b)/i)
    expect(source).not.toMatch(/^\s*\.(?:ad|ads|advert|advertisement|sponsor|sponsored)(?:-|_|\b)/im)
    expect(source).not.toContain('.ad-content')
  })
})
