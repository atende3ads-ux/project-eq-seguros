/**
 * Ícones dos cards do menu (mesmos do cabeçalho do site: ver `DI` em prototipo/assets/site.js).
 * Conteúdo fixo do código, nunca digitado no painel: pode ir direto para o HTML.
 */
export const MENU_ICONS: Record<string, { label: string; svg: string }> = {
  heart: { label: "Coração", svg: "<path d=\"M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1.1L12 21l7.8-7.8 1-1a5.5 5.5 0 0 0 0-7.8z\"/>" },
  shield: { label: "Escudo", svg: "<path d=\"M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z\"/>" },
  pulse: { label: "Batimento", svg: "<polyline points=\"22 12 18 12 15 21 9 3 6 12 2 12\"/>" },
  leaf: { label: "Folha", svg: "<path d=\"M20.2 12.2a6 6 0 0 0-8.5-8.5L5 10.5V19h8.5z\"/><line x1=\"16\" y1=\"8\" x2=\"2\" y2=\"22\"/><line x1=\"17.5\" y1=\"15\" x2=\"9\" y2=\"15\"/>" },
  plane: { label: "Avião", svg: "<path d=\"M22 2 11 13\"/><path d=\"M22 2 15 22l-4-9-9-4 20-7z\"/>" },
  life: { label: "Boia de salvamento", svg: "<circle cx=\"12\" cy=\"12\" r=\"10\"/><circle cx=\"12\" cy=\"12\" r=\"4\"/><line x1=\"4.9\" y1=\"4.9\" x2=\"9.2\" y2=\"9.2\"/><line x1=\"14.8\" y1=\"14.8\" x2=\"19.1\" y2=\"19.1\"/><line x1=\"14.8\" y1=\"9.2\" x2=\"19.1\" y2=\"4.9\"/><line x1=\"9.2\" y1=\"14.8\" x2=\"4.9\" y2=\"19.1\"/>" },
  gift: { label: "Presente", svg: "<polyline points=\"20 12 20 22 4 22 4 12\"/><rect x=\"2\" y=\"7\" width=\"20\" height=\"5\"/><line x1=\"12\" y1=\"22\" x2=\"12\" y2=\"7\"/><path d=\"M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z\"/><path d=\"M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z\"/>" },
  api: { label: "Código (API)", svg: "<polyline points=\"16 18 22 12 16 6\"/><polyline points=\"8 6 2 12 8 18\"/>" },
  doc: { label: "Documento", svg: "<path d=\"M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z\"/><polyline points=\"14 2 14 8 20 8\"/><line x1=\"16\" y1=\"13\" x2=\"8\" y2=\"13\"/><line x1=\"16\" y1=\"17\" x2=\"8\" y2=\"17\"/>" },
  bolt: { label: "Raio", svg: "<polygon points=\"13 2 3 14 12 14 11 22 21 10 12 10 13 2\"/>" },
  users: { label: "Pessoas", svg: "<path d=\"M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2\"/><circle cx=\"9\" cy=\"7\" r=\"4\"/><path d=\"M23 21v-2a4 4 0 0 0-3-3.87\"/><path d=\"M16 3.13a4 4 0 0 1 0 7.75\"/>" },
  handshake: { label: "Aperto de mão", svg: "<path d=\"M11 17l2 2a1 1 0 1 0 3-3\"/><path d=\"M14 14l2.5 2.5a1 1 0 1 0 3-3l-3.88-3.88a3 3 0 0 0-4.24 0l-.88.88a1 1 0 1 1-3-3l2.81-2.81a5.79 5.79 0 0 1 7.06-.87l.47.28a2 2 0 0 0 1.42.25L21 4\"/><path d=\"M21 3l1 11h-2\"/><path d=\"M3 3L2 14l6.5 6.5a1 1 0 1 0 3-3\"/><path d=\"M3 4h8\"/>" },
  award: { label: "Medalha", svg: "<circle cx=\"12\" cy=\"8\" r=\"6\"/><polyline points=\"15.5 13 17 22 12 19 7 22 8.5 13\"/>" },
  chat: { label: "Conversa", svg: "<path d=\"M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.4 8.4 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8z\"/>" },
}
export const MENU_ICON_OPTIONS = Object.entries(MENU_ICONS).map(([value, { label }]) => ({ label, value }))
