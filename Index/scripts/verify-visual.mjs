import fs from 'node:fs'
import path from 'node:path'
import http from 'node:http'
import { chromium } from 'playwright'
import { PNG } from 'pngjs'
import pixelmatch from 'pixelmatch'
import { prototypeSource } from './prototype-source.mjs'

const root = path.resolve(import.meta.dirname, '..')
const source = prototypeSource
const data = JSON.parse(fs.readFileSync(path.join(root, 'src/generated/prototype.json')))
const output = path.join(root, 'test-results/visual')
fs.mkdirSync(output, { recursive: true })
const mime = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.woff2': 'font/woff2' }
const server = http.createServer((req, res) => {
  const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname)
  const file = path.resolve(source, '.' + pathname)
  if (!file.startsWith(source + '/') || !fs.existsSync(file) || !fs.statSync(file).isFile()) { res.writeHead(404); res.end(); return }
  res.setHeader('Content-Type', mime[path.extname(file)] || 'application/octet-stream')
  fs.createReadStream(file).pipe(res)
})
await new Promise((resolve) => server.listen(4173, '127.0.0.1', resolve))
const browser = await chromium.launch({ headless: true })
const results = []
const slugs = process.env.VISUAL_SLUGS?.split(',') || data.pages.map((p) => p.slug)
try {
  for (const viewport of [{ width: 1440, height: 1000 }, { width: 390, height: 844 }]) {
    const context = await browser.newContext({ viewport, reducedMotion: 'reduce', deviceScaleFactor: 1 })
    const original = await context.newPage()
    const converted = await context.newPage()
    for (const slug of slugs) {
      const statuses = await Promise.all([
        original.goto(`http://127.0.0.1:4173/${slug}.html`, { waitUntil: 'networkidle' }),
        converted.goto(`http://127.0.0.1:3000/${slug === 'index' ? '' : slug}`, { waitUntil: 'networkidle' }),
      ])
      if (statuses.some((r) => r.status() !== 200)) throw Error(`Página ${slug} não respondeu 200`)
      for (const page of [original, converted]) {
        await page.evaluate(async () => {
          await document.fonts.ready
          document.querySelectorAll('.rv-init').forEach((el) => el.classList.add('rv'))
          for (let y = 0; y < document.body.scrollHeight; y += 600) window.scrollTo(0, y)
          await Promise.all(Array.from(document.images).map((img) => img.complete ? null : new Promise((resolve) => { img.onload = resolve; img.onerror = resolve })))
          window.scrollTo(0, 0)
        })
        await page.addStyleTag({ content: 'nextjs-portal{display:none!important}html{scroll-behavior:auto!important}*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important}.rv-init{opacity:1!important;transform:none!important}' })
        await page.evaluate(() => { window.scrollTo(0, 0); document.getElementById('nav')?.classList.remove('scrolled') })
        await page.waitForTimeout(600)
      }
      const prefix = `${viewport.width}-${slug}`
      const before = PNG.sync.read(await original.screenshot({ path: path.join(output, prefix + '-original.png'), fullPage: true }))
      const after = PNG.sync.read(await converted.screenshot({ path: path.join(output, prefix + '-next.png'), fullPage: true }))
      let percent = 100
      if (before.width === after.width && before.height === after.height) {
        const diff = new PNG({ width: before.width, height: before.height })
        const pixels = pixelmatch(before.data, after.data, diff.data, before.width, before.height, { threshold: 0.15 })
        percent = pixels / (before.width * before.height) * 100
        fs.writeFileSync(path.join(output, prefix + '-diff.png'), PNG.sync.write(diff))
      }
      const result = { slug, width: viewport.width, beforeHeight: before.height, afterHeight: after.height, differentPixelsPercent: Number(percent.toFixed(5)) }
      results.push(result)
      console.log(JSON.stringify(result))
    }
    await context.close()
  }
} finally {
  const reportPath = path.join(output, 'report.json')
  const previous = process.env.VISUAL_SLUGS && fs.existsSync(reportPath) ? JSON.parse(fs.readFileSync(reportPath, 'utf8')) : []
  const updated = previous.filter((entry) => !results.some((result) => result.slug === entry.slug && result.width === entry.width))
  fs.writeFileSync(reportPath, JSON.stringify([...updated, ...results], null, 2) + '\n')
  await browser.close(); server.close()
}
if (results.some((r) => r.differentPixelsPercent > 0.5)) process.exitCode = 1
