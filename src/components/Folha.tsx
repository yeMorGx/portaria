import * as Dialog from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import type { ReactNode } from 'react'
import { Botao } from './ui'

/** Painel lateral (de baixo no celular): edita um item sem perder a lista de vista. */
export function Folha({
  aberta,
  aoFechar,
  titulo,
  descricao,
  children,
}: {
  aberta: boolean
  aoFechar: () => void
  titulo: string
  descricao?: string
  children: ReactNode
}) {
  return (
    <Dialog.Root open={aberta} onOpenChange={(v) => !v && aoFechar()}>
      <Dialog.Portal>
        <Dialog.Overlay className="folha-fundo fixed inset-0 z-50 bg-black/45" />
        <Dialog.Content
          className="folha fixed inset-x-0 bottom-0 z-50 flex max-h-[92vh] flex-col rounded-t-tile border-t border-line bg-bg md:inset-y-0 md:right-0 md:left-auto md:max-h-none md:w-[560px] md:rounded-none md:border-t-0 md:border-l"
        >
          <div className="flex items-start justify-between gap-4 border-b border-line px-6 py-5">
            <div className="min-w-0">
              <Dialog.Title className="text-xl font-semibold tracking-[-0.01em]">{titulo}</Dialog.Title>
              {descricao ? (
                <Dialog.Description className="m-0 mt-1 text-sm text-muted">{descricao}</Dialog.Description>
              ) : (
                <Dialog.Description className="sr-only">{titulo}</Dialog.Description>
              )}
            </div>
            <Dialog.Close asChild>
              <button
                type="button"
                aria-label="Fechar"
                className="grid size-11 shrink-0 cursor-pointer place-items-center rounded-botao text-muted transition duration-[120ms] hover:bg-s1 hover:text-ink"
              >
                <X className="size-5" strokeWidth={1.75} />
              </button>
            </Dialog.Close>
          </div>
          <div className="flex-1 space-y-6 overflow-y-auto px-6 py-6">{children}</div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

/** Confirmação de ação que muda acesso ou some com algo da lista. A ação é sempre nomeada no botão. */
export function Confirmacao({
  aberta,
  titulo,
  texto,
  acao,
  perigo,
  aoConfirmar,
  aoCancelar,
}: {
  aberta: boolean
  titulo: string
  texto: string
  acao: string
  perigo?: boolean
  aoConfirmar: () => void
  aoCancelar: () => void
}) {
  return (
    <Dialog.Root open={aberta} onOpenChange={(v) => !v && aoCancelar()}>
      <Dialog.Portal>
        <Dialog.Overlay className="folha-fundo fixed inset-0 z-[60] bg-black/45" />
        <Dialog.Content className="confirmacao fixed top-1/2 left-1/2 z-[60] w-[calc(100%-32px)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-tile border border-line bg-s1 p-6 shadow-[var(--shadow-overlay)]">
          <Dialog.Title className="text-lg font-semibold">{titulo}</Dialog.Title>
          <Dialog.Description className="m-0 mt-2 text-muted">{texto}</Dialog.Description>
          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Botao variante="secundario" onClick={aoCancelar}>
              Cancelar
            </Botao>
            <Botao className={perigo ? '!bg-danger !text-white hover:!opacity-90' : ''} onClick={aoConfirmar}>
              {acao}
            </Botao>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
