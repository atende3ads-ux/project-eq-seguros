'use client'
import { useState } from 'react'
import type { CaseRecord } from '@/lib/types'
import { segments, imageURL } from '@/lib/cases'
function Arrow() {
  return <svg viewBox="0 0 24 24"><line x1="7" y1="17" x2="17" y2="7"/><polyline points="7 7 17 7 17 17"/></svg>
}
export function CaseCards({ records, filter = '' }: { records: CaseRecord[]; filter?: string }) {
  return records.map((record) => <a key={record.slug} className="casecard rv-init" href={`/case?c=${encodeURIComponent(record.slug)}`} data-seg={record.segmento} hidden={Boolean(filter && filter !== record.segmento)}>
    <div className="cc-media"><img src={imageURL(record)} alt="" loading="lazy"/><span className="cc-seg">{segments[record.segmento]}</span></div>
    <div className="cc-body">
      {!record.aprovado && <span className="cc-flag">Case ilustrativo</span>}
      <span className="cc-parceiro">{record.parceiro}</span><h4>{record.titulo}</h4><p>{record.resumo}</p>
      {record.resultados?.[0] && <div className="cc-kpi"><b>{record.resultados[0].valor}</b><span>{record.resultados[0].rotulo}</span></div>}
      <span className="link-arrow"><span>Ler o case</span><Arrow/></span>
    </div>
  </a>)
}
export function CasesListing({ records }: { records: CaseRecord[] }) {
  const [filter, setFilter] = useState('')
  return <>
    <div className="chips rv-init" id="cases-filtro" role="group" aria-label="Filtrar cases por segmento">
      <button className={`chip${!filter ? ' on' : ''}`} type="button" data-seg="" onClick={() => setFilter('')}>Todos</button>
      {Object.entries(segments).filter(([key]) => records.some((r) => r.segmento === key)).map(([key, label]) =>
        <button key={key} className={`chip${filter === key ? ' on' : ''}`} type="button" data-seg={key} onClick={() => setFilter(key)}>{label}</button>)}
    </div>
    <div className="casegrid" id="cases-grid"><CaseCards records={records} filter={filter}/></div>
  </>
}
