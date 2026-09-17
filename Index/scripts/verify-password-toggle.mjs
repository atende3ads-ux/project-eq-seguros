import assert from 'node:assert/strict'
import { chromium } from 'playwright'

const browser = await chromium.launch({ headless: true })
try {
  for (const width of [1440, 390]) {
    const context = await browser.newContext({ viewport: { width, height: 900 } })
    const page = await context.newPage()
    const errors = []
    page.on('pageerror', (error) => errors.push(error.message))
    await page.goto('http://localhost:3000/admin/login', { waitUntil: 'networkidle' })
    const field = page.locator('#field-password')
    const show = page.getByRole('button', { name: 'Mostrar senha', exact: true })
    await show.waitFor()
    assert.equal(await field.getAttribute('type'), 'password')
    await field.fill('Senha-ficticia-de-teste')
    assert.equal(await show.getAttribute('type'), 'button')
    assert.equal(await show.getAttribute('aria-pressed'), 'false')
    const inputBox = await field.boundingBox()
    const buttonBox = await show.boundingBox()
    assert.ok(buttonBox.x >= inputBox.x && buttonBox.x + buttonBox.width <= inputBox.x + inputBox.width)
    assert.ok(buttonBox.y >= inputBox.y && buttonBox.y + buttonBox.height <= inputBox.y + inputBox.height)
    await show.click()
    await page.waitForFunction(() => document.querySelector('#field-password').type === 'text')
    assert.equal(await field.inputValue(), 'Senha-ficticia-de-teste')
    const hide = page.getByRole('button', { name: 'Ocultar senha', exact: true })
    assert.equal(await hide.getAttribute('aria-pressed'), 'true')
    await hide.focus()
    await page.keyboard.press('Enter')
    await page.waitForFunction(() => document.querySelector('#field-password').type === 'password')
    assert.equal(await field.inputValue(), 'Senha-ficticia-de-teste')
    assert.ok(page.url().endsWith('/admin/login'))
    await page.reload({ waitUntil: 'networkidle' })
    await page.getByRole('button', { name: 'Mostrar senha', exact: true }).waitFor()
    assert.equal(await field.getAttribute('type'), 'password')
    assert.deepEqual(errors, [])
    await context.close()
    console.log(`PASS: botão de senha em ${width}px, clique, teclado, valor preservado e senha oculta após recarregar.`)
  }
} finally {
  await browser.close()
}
