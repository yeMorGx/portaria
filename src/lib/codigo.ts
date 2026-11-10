/** Código de retirada de 6 dígitos, de uso único. O banco guarda só o hash. */
export function gerarCodigo(): string {
  const n = new Uint32Array(1)
  crypto.getRandomValues(n)
  return String(n[0] % 1_000_000).padStart(6, '0')
}

export async function hashCodigo(id: string, codigo: string): Promise<string> {
  const dados = new TextEncoder().encode(`${id}:${codigo}`)
  const h = await crypto.subtle.digest('SHA-256', dados)
  return [...new Uint8Array(h)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

const CHAVE = 'portaria.codigos-simulados'

/**
 * MODO SIMULADO: enquanto não há provedor de WhatsApp, o código fica só neste aparelho, para a demonstração.
 * Em produção o código sai apenas por mensagem ao morador e nunca é guardado em texto aberto.
 */
export function guardarCodigoSimulado(id: string, codigo: string) {
  try {
    const mapa = JSON.parse(localStorage.getItem(CHAVE) ?? '{}') as Record<string, string>
    mapa[id] = codigo
    localStorage.setItem(CHAVE, JSON.stringify(mapa))
  } catch {
    /* sem armazenamento: o fluxo segue sem a dica de demonstração */
  }
}

export function lerCodigoSimulado(id: string): string | null {
  try {
    return (JSON.parse(localStorage.getItem(CHAVE) ?? '{}') as Record<string, string>)[id] ?? null
  } catch {
    return null
  }
}

export function mensagemAviso(nome: string, loja: string | null, transportadora: string | null, codigo: string) {
  const origem = [loja, transportadora].filter(Boolean).join(' · ')
  return `Olá, ${nome.split(' ')[0]}! Chegou uma encomenda para você na portaria${origem ? ` (${origem})` : ''}. Código de retirada: ${codigo}. Informe o código ao funcionário na entrega.`
}
