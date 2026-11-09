import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { IconePacote, IconeSeta } from './icons'

type Variante = 'primario' | 'secundario' | 'fantasma'

const estilos: Record<Variante, string> = {
  primario:
    'bg-brand text-white shadow-[0_1px_2px_rgb(0_0_0/.18),0_6px_16px_-6px_rgb(13_90_74/.55)] hover:bg-brand-strong active:translate-y-px dark:text-[#06231d]',
  secundario: 'bg-card text-ink border border-line hover:border-brand active:translate-y-px',
  fantasma: 'text-muted hover:text-ink hover:bg-brand-soft',
}

export function Botao({
  variante = 'primario',
  grande,
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variante?: Variante; grande?: boolean }) {
  return (
    <button
      {...props}
      className={`inline-flex cursor-pointer items-center justify-center gap-3 rounded-xl font-semibold transition duration-150 disabled:cursor-not-allowed disabled:opacity-50 ${
        grande ? 'min-h-16 px-8 text-xl' : 'min-h-12 px-5 text-base'
      } ${estilos[variante]} ${className}`}
    />
  )
}

export function Marca() {
  return (
    <span className="inline-flex items-center gap-2.5 text-lg font-bold tracking-tight">
      <span className="grid size-9 place-items-center rounded-lg bg-brand text-xl text-white dark:text-[#06231d]">
        <IconePacote />
      </span>
      Portaria
    </span>
  )
}

export function Cabecalho({ titulo, voltar, direita }: { titulo: string; voltar?: () => void; direita?: ReactNode }) {
  return (
    <header className="mb-8 flex items-center justify-between gap-4">
      <div className="flex min-w-0 items-center gap-3">
        {voltar && (
          <Botao variante="fantasma" onClick={voltar} className="!min-h-11 !gap-2 !px-3">
            <IconeSeta className="size-5" />
            Voltar
          </Botao>
        )}
        <h1 className="truncate text-2xl font-bold tracking-tight">{titulo}</h1>
      </div>
      {direita}
    </header>
  )
}

export function Aviso({ children }: { children: ReactNode }) {
  return (
    <p role="alert" className="rounded-lg bg-danger/10 px-4 py-3 text-danger ring-1 ring-danger/30">
      {children}
    </p>
  )
}

export function EstadoVazio() {
  return (
    <div className="flex flex-col items-center gap-4 rounded-2xl border border-line bg-card px-6 py-14 text-center">
      <span className="grid size-16 place-items-center rounded-2xl bg-brand-soft text-3xl text-brand">
        <IconePacote />
      </span>
      <div>
        <p className="text-lg font-semibold">Nenhuma encomenda registrada ainda</p>
        <p className="mt-1 text-muted">Toque em “Nova Encomenda” quando chegar o primeiro pacote.</p>
      </div>
    </div>
  )
}
