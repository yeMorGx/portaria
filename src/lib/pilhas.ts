import type { Encomenda } from './data'

export interface Pilha {
  chave: string
  /** Encomendas da pilha, da mais recente para a mais antiga. */
  itens: Encomenda[]
}

/** Quem recebe: a empresa, no modelo comercial; o apartamento, nos registros antigos de morador. */
export function chavePilha(e: Encomenda): string {
  return e.empresa_id ? `empresa:${e.empresa_id}` : `apto:${e.bloco ?? ''}|${e.apartamento}`
}

/** Junta as encomendas do mesmo destino, mantendo a ordem da mais recente para a mais antiga. */
export function empilhar(lista: Encomenda[]): Pilha[] {
  const ordenadas = [...lista].sort((a, b) => b.recebido_em.localeCompare(a.recebido_em))
  const porChave = new Map<string, Pilha>()
  for (const e of ordenadas) {
    const chave = chavePilha(e)
    const pilha = porChave.get(chave)
    if (pilha) pilha.itens.push(e)
    else porChave.set(chave, { chave, itens: [e] })
  }
  return [...porChave.values()]
}

/** Quantas encomendas do mesmo destino ainda aguardam retirada (incluindo esta). */
export function aguardandoNoDestino(lista: Encomenda[], e: Encomenda): Encomenda[] {
  const chave = chavePilha(e)
  return lista.filter((x) => x.status !== 'retirada' && chavePilha(x) === chave)
}
