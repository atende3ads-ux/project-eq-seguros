export type TextEntry = { key: string; label: string; value: string }
export type ImageEntry = { key: string; label: string; src: string; alt: string; media?: number | { url?: string | null } | null }
export type LinkEntry = { key: string; label: string; href: string }
export type Content = { copy?: TextEntry[]; images?: ImageEntry[]; links?: LinkEntry[] }
export type TemplateNode = { tag?: string; attrs?: Record<string, string>; children?: TemplateNode[]; text?: string; textKey?: string; imageKey?: string; linkKey?: string }
export type PageTemplate = { slug: string; title: string; description: string; body: TemplateNode[]; header: TemplateNode[]; content: Content }
export type CaseRecord = {
  slug: string; parceiro: string; segmento: string; titulo: string; resumo: string; imagem: string;
  media?: ImageEntry['media']; produtos: { nome: string }[]; resultados: { valor: string; rotulo: string }[];
  desafio: string; solucao: string; depoimento: { texto: string; autor: string; cargo: string };
  destaque: boolean; aprovado: boolean;
}
