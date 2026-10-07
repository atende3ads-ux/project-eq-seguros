/**
 * Marcador `{ano}` nos textos editáveis: o site troca pelo ano atual a cada
 * acesso, então "© {ano} EQ Seguros" vira "© 2027" sozinho na virada do ano.
 * Para fixar um ano, basta escrevê-lo no lugar do marcador.
 */
export const YEAR_TOKEN = '{ano}'

/** Ano atual no horário de Brasília: não vira antes da meia-noite daqui. */
export const currentYear = (now: Date = new Date()) =>
  Number(new Intl.DateTimeFormat('en-US', { year: 'numeric', timeZone: 'America/Sao_Paulo' }).format(now))

export const withYear = (text: string, now?: Date) =>
  text.includes('{') ? text.replace(/\{ano\}/gi, String(currentYear(now))) : text

/**
 * Só o ano logo depois do © vira marcador. Outros anos do texto (fundação,
 * marcos da empresa, leis) são fatos e ficam como estão; intervalos como
 * "© 2019–2026" também não são tocados.
 */
export const copyrightToToken = (text: string) => text.replace(/(©\s*)20\d{2}(?![\d\-–])/g, `$1${YEAR_TOKEN}`)
