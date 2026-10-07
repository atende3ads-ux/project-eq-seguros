/** Dados estruturados no HTML. O `<` é escapado para o conteúdo nunca fechar a tag antes da hora. */
export function JsonLd({ data }: { data: unknown }) {
  if (!data) return null
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }} />
}
