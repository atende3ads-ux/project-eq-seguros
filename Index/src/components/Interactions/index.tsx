'use client'
import { useEffect } from 'react'

export function Interactions({ slug }: { slug: string }) {
  useEffect(() => {
    const controller = new AbortController()
    const options = { signal: controller.signal }
    const timers = new Set<ReturnType<typeof setTimeout>>()
    const mobile = () => window.matchMedia('(max-width:860px)').matches
    document.querySelectorAll<HTMLElement>('.has-dd').forEach((item) => {
      let timer: ReturnType<typeof setTimeout>
      item.addEventListener('mouseenter', () => { if (!mobile()) { clearTimeout(timer); item.classList.add('open') } }, options)
      item.addEventListener('mouseleave', () => { if (!mobile()) { timer = setTimeout(() => item.classList.remove('open'), 180); timers.add(timer) } }, options)
      item.querySelector('.nav-top')?.addEventListener('click', (event) => { if (mobile()) { event.preventDefault(); item.classList.toggle('open') } }, options)
    })
    document.querySelectorAll<HTMLElement>('.dd-cat').forEach((cat) => {
      const activate = () => {
        const box = cat.closest('.dd')
        box?.querySelectorAll('.dd-cat').forEach((x) => x.classList.toggle('on', x === cat))
        box?.querySelectorAll('.dd-panel').forEach((p) => p.classList.toggle('on', p.id === cat.dataset.cat))
      }
      cat.addEventListener('mouseenter', () => { if (!mobile()) activate() }, options)
      cat.addEventListener('click', (e) => { e.preventDefault(); activate() }, options)
    })
    document.addEventListener('click', (e) => {
      if (!mobile() && !(e.target as Element).closest('.has-dd')) document.querySelectorAll('.has-dd.open').forEach((x) => x.classList.remove('open'))
    }, options)
    const updateScroll = () => document.getElementById('nav')?.classList.toggle('scrolled', window.scrollY > 10)
    window.addEventListener('scroll', updateScroll, { ...options, passive: true })
    updateScroll()
    document.getElementById('burger')?.addEventListener('click', () => {
      const menu = document.getElementById('menu')
      const open = menu?.classList.toggle('open')
      const button = menu?.querySelector<HTMLElement>('.btn')
      if (button) button.style.display = open ? 'inline-flex' : 'none'
    }, options)
    const observer = new IntersectionObserver((entries) => entries.forEach((entry) => {
      if (!entry.isIntersecting) return
      const element = entry.target
      const siblings = Array.from(element.parentElement?.children || []).filter((x) => x.classList.contains('rv-init'))
      const timer = setTimeout(() => element.classList.add('rv'), Math.min(Math.max(0, siblings.indexOf(element)), 7) * 85)
      timers.add(timer); observer.unobserve(element)
    }), { threshold: .12, rootMargin: '0px 0px -60px 0px' })
    document.querySelectorAll('.rv-init').forEach((el) => observer.observe(el))
    return () => { controller.abort(); observer.disconnect(); timers.forEach(clearTimeout) }
  }, [slug])
  return null
}
