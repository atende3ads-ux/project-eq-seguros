import test from 'node:test'
import assert from 'node:assert/strict'
import { trackingFor } from '../src/lib/tracking.ts'

const settings = { gtmId: 'GTM-M6GGJCP', ga4Id: 'G-CX9NWGZ8FY', clarityId: 'mcupj06yj5' }

test('should load no tracking outside production', () => {
  assert.deepEqual(trackingFor(settings, false), {})
})
test('should load every configured tracking ID in production', () => {
  assert.deepEqual(trackingFor(settings, true), { gtm: 'GTM-M6GGJCP', ga4: 'G-CX9NWGZ8FY', clarity: 'mcupj06yj5' })
  assert.deepEqual(trackingFor({ gtmId: ' GTM-M6GGJCP ' }, true), { gtm: 'GTM-M6GGJCP', ga4: undefined, clarity: undefined })
})
test('should drop an ID that is empty or not in the expected format, so nothing typed in the panel becomes code', () => {
  const tracking = trackingFor({ gtmId: "GTM-X');alert(1);//", ga4: 'UA-123', ga4Id: '', clarityId: '"><script>' }, true)
  assert.deepEqual(tracking, { gtm: undefined, ga4: undefined, clarity: undefined })
})
