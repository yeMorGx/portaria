/**
 * Contato do botão "Pedir demonstração".
 * TROQUE pelo número real (só dígitos, com 55 e DDD). Enquanto for este exemplo, o site avisa no rodapé.
 */
export const WHATSAPP_NUMERO = '5500000000000'
export const WHATSAPP_EXEMPLO = WHATSAPP_NUMERO === '5500000000000'
export const WHATSAPP_MENSAGEM =
  'Olá! Vi o site do Portaria e quero agendar uma demonstração para o meu condomínio.'

export const linkWhatsapp = () =>
  `https://wa.me/${WHATSAPP_NUMERO}?text=${encodeURIComponent(WHATSAPP_MENSAGEM)}`
