import type { Access, CollectionConfig } from 'payload'

const signedIn: Access = ({ req }) => Boolean(req.user)
const adminOnly: Access = ({ req }) => req.user?.role === 'admin'

/**
 * Contatos recebidos pelos formulários do site. Ninguém de fora cria registro direto: quem grava é a rota
 * /enviar-formulario, depois de validar. O e-mail para a equipe é só um aviso; o contato fica sempre aqui.
 * Não guarda IP nem dados do navegador.
 */
export const Messages: CollectionConfig = {
  slug: 'messages', labels: { singular: 'Mensagem recebida', plural: 'Mensagens recebidas' },
  admin: {
    hideAPIURL: true, group: 'Formulários', useAsTitle: 'summary', defaultColumns: ['createdAt', 'summary', 'form', 'mailStatus', 'handled'],
    description: 'Contatos enviados pelos formulários do site. Marque “Atendida” depois de responder. Os dados pessoais ficam só aqui: apague o que não for mais necessário.',
  },
  defaultSort: '-createdAt',
  access: { create: () => false, read: signedIn, update: signedIn, delete: adminOnly },
  fields: [
    { name: 'summary', label: 'Resumo', type: 'text', admin: { readOnly: true, hidden: true } },
    { name: 'handled', label: 'Atendida', type: 'checkbox', defaultValue: false, admin: { position: 'sidebar', description: 'Marque quando o contato já foi respondido.' } },
    { name: 'form', label: 'Formulário', type: 'text', admin: { readOnly: true, position: 'sidebar' } },
    { name: 'page', label: 'Página', type: 'text', admin: { readOnly: true, position: 'sidebar' } },
    { name: 'mailStatus', label: 'E-mail para a equipe', type: 'select', defaultValue: 'not-configured', admin: { readOnly: true, position: 'sidebar', description: 'Se aparecer “Falhou”, o contato está salvo aqui, mas o aviso não chegou: confira a chave de e-mail.' },
      options: [{ label: 'Enviado', value: 'sent' }, { label: 'Falhou', value: 'failed' }, { label: 'Não configurado', value: 'not-configured' }] },
    { name: 'mailError', label: 'Erro do e-mail', type: 'text', admin: { readOnly: true, position: 'sidebar', condition: (data) => data?.mailStatus === 'failed' } },
    { name: 'answers', label: 'Respostas', type: 'array', admin: { readOnly: true }, fields: [
      { name: 'label', label: 'Campo', type: 'text', required: true },
      { name: 'value', label: 'Resposta', type: 'textarea', required: true },
    ] },
  ],
}
