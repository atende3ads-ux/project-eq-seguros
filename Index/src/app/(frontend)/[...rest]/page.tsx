import { notFound } from 'next/navigation'

export const dynamic = 'force-dynamic'

/** Endereços com mais de um trecho que não existem (/a/b/c) também mostram a página 404 do site, com cabeçalho e rodapé. */
export default function Missing() {
  notFound()
}
