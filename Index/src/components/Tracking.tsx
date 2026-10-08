import type { Tracking } from '@/lib/tracking'

/**
 * Scripts de medição, no cabeçalho. O Tag Manager vem primeiro, como o Google
 * recomenda; o Google Analytics direto e o Clarity entram só se tiverem ID.
 * O `dataLayer` é criado sempre que há Tag Manager ou Analytics, para os eventos do
 * site (como o envio de formulário) existirem antes de qualquer script carregar.
 */
export function TrackingHead({ gtm, ga4, clarity }: Tracking) {
  return <>
    {(gtm || ga4) && <script dangerouslySetInnerHTML={{ __html: 'window.dataLayer=window.dataLayer||[];' }} />}
    {gtm && <script dangerouslySetInnerHTML={{ __html: `(function(w,d,s,l,i){w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${gtm}');` }} />}
    {ga4 && <>
      <script async src={`https://www.googletagmanager.com/gtag/js?id=${ga4}`} />
      <script dangerouslySetInnerHTML={{ __html: `function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${ga4}');` }} />
    </>}
    {clarity && <script dangerouslySetInnerHTML={{ __html: `(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);})(window,document,"clarity","script","${clarity}");` }} />}
  </>
}

/** Versão do Tag Manager para quem navega sem JavaScript; vai logo depois de abrir o `<body>`. */
export function TrackingBody({ gtm }: Tracking) {
  if (!gtm) return null
  return <noscript><iframe src={`https://www.googletagmanager.com/ns.html?id=${gtm}`} height="0" width="0" style={{ display: 'none', visibility: 'hidden' }} title="Google Tag Manager" /></noscript>
}
