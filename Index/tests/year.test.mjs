import test from 'node:test'
import assert from 'node:assert/strict'
import { currentYear, withYear, copyrightToToken } from '../src/lib/year.ts'

test('should replace {ano} by the current year', () => {
  assert.equal(withYear('© {ano} EQ Seguros', new Date('2026-10-07T12:00:00Z')), '© 2026 EQ Seguros')
  assert.equal(withYear('© {ANO} e {ano}', new Date('2027-03-01T12:00:00Z')), '© 2027 e 2027')
  assert.equal(withYear('sem marcador'), 'sem marcador')
})
test('should change year at midnight in Brasilia, not in UTC', () => {
  assert.equal(currentYear(new Date('2027-01-01T02:59:00Z')), 2026) // 23:59 de 31/12 em Brasília
  assert.equal(currentYear(new Date('2027-01-01T03:00:00Z')), 2027) // 00:00 de 01/01 em Brasília
})
test('should tokenize only the year right after the copyright sign', () => {
  assert.equal(copyrightToToken('© 2026 EQ Seguros'), '© {ano} EQ Seguros')
  assert.equal(copyrightToToken('©2026 EQ'), '©{ano} EQ')
  assert.equal(copyrightToToken('Fundada em 2014 · © 2026'), 'Fundada em 2014 · © {ano}')
  assert.equal(copyrightToToken('© 2019–2026 EQ'), '© 2019–2026 EQ')
  assert.equal(copyrightToToken('Lei 13.709/2018'), 'Lei 13.709/2018')
})
