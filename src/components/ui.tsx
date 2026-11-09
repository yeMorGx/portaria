import { ArrowLeft, Package, RotateCw } from 'lucide-react'
import { motion, useReducedMotion } from 'motion/react'
import type { ButtonHTMLAttributes, ReactNode } from 'react'

const EASE_SAIDA = [0.16, 1, 0.3, 1] as const

type Variante = 'primario' | 'secundario' | 'fantasma'

const estilos: Record<Variante, string> = {
  primario:
    'bg-accent text-on-accent shadow-[var(--shadow-primary)] hover:bg-accent-strong active:translate-y-px',
  secundario: 'bg-s1 text-ink border border-line hover:bg-s2 active:translate-y-px',
  fantasma: 'text-muted hover:text-ink hover:bg-s2',
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
      className={`inline-flex cursor-pointer items-center justify-center gap-3 rounded-botao font-semibold tracking-[-0.01em] transition duration-[120ms] disabled:cursor-not-allowed disabled:opacity-50 ${
        grande ? 'min-h-16 px-6 text-lg md:px-8 md:text-xl' : 'min-h-12 px-5 text-base'
      } ${estilos[variante]} ${className}`}
    />
  )
}

/** Entrada escalonada dos tiles (360 ms, 40 ms entre cada), reduzida a fade com movimento reduzido. */
export function Aparecer({
  i = 0,
  className,
  children,
}: {
  i?: number
  className?: string
  children: ReactNode
}) {
  const reduzir = useReducedMotion()
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: reduzir ? 0 : 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduzir ? 0.12 : 0.36, delay: reduzir ? 0 : i * 0.04, ease: EASE_SAIDA }}
    >
      {children}
    </motion.div>
  )
}

/** Título de tela: entra desfocado e fica nítido (referência: Linear). */
export function Titulo({ children, className = '' }: { children: ReactNode; className?: string }) {
  const reduzir = useReducedMotion()
  return (
    <motion.h1
      className={`text-[32px] leading-9 font-semibold tracking-[-0.02em] md:text-5xl md:leading-[48px] md:tracking-[-0.03em] ${className}`}
      initial={{ opacity: 0, filter: reduzir ? 'none' : 'blur(8px)' }}
      animate={{ opacity: 1, filter: 'blur(0px)' }}
      transition={{ duration: reduzir ? 0.12 : 0.6, ease: EASE_SAIDA }}
    >
      {children}
    </motion.h1>
  )
}

export function Pagina({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <main className={`mx-auto w-full max-w-[1200px] px-4 py-6 md:px-8 md:py-10 ${className}`}>{children}</main>
  )
}

export function Marca() {
  return (
    <span className="inline-flex items-center gap-2.5 text-lg font-semibold tracking-[-0.01em]">
      <span className="grid size-9 place-items-center rounded-campo bg-accent text-on-accent">
        <Package className="size-5" strokeWidth={1.75} />
      </span>
      Portaria
    </span>
  )
}

export function Passo({ atual }: { atual: 1 | 2 | 3 }) {
  return (
    <p className="rotulo num" aria-label={`Passo ${atual} de 3`}>
      {atual} de 3
    </p>
  )
}

export function Cabecalho({
  titulo,
  passo,
  voltar,
  direita,
}: {
  titulo: string
  passo?: 1 | 2 | 3
  voltar?: () => void
  direita?: ReactNode
}) {
  return (
    <header className="mb-6 md:mb-8">
      <div className="mb-4 flex min-h-11 items-center justify-between gap-3">
        {voltar ? (
          <Botao variante="fantasma" onClick={voltar} className="!min-h-11 !gap-2 !px-3 -ml-3">
            <ArrowLeft className="size-5" strokeWidth={1.75} />
            Voltar
          </Botao>
        ) : (
          <Marca />
        )}
        {passo ? <Passo atual={passo} /> : direita}
      </div>
      <Titulo>{titulo}</Titulo>
    </header>
  )
}

export function Aviso({
  children,
  aoRepetir,
}: {
  children: ReactNode
  aoRepetir?: () => void
}) {
  return (
    <div
      role="alert"
      className="flex flex-wrap items-center justify-between gap-3 rounded-botao bg-danger/10 px-4 py-3 text-danger ring-1 ring-danger/30"
    >
      <p className="m-0">{children}</p>
      {aoRepetir && (
        <Botao variante="secundario" onClick={aoRepetir} className="!min-h-11 !gap-2 text-ink">
          <RotateCw className="size-4" strokeWidth={1.75} />
          Tentar de novo
        </Botao>
      )}
    </div>
  )
}

export function EstadoVazio() {
  return (
    <div className="flex flex-col items-center gap-4 px-6 py-14 text-center">
      <span className="grid size-16 place-items-center rounded-botao bg-accent-soft text-accent">
        <Package className="size-8" strokeWidth={1.5} />
      </span>
      <div>
        <p className="m-0 text-lg font-semibold">Nenhuma encomenda registrada ainda</p>
        <p className="m-0 mt-1 text-muted">Toque em “Nova Encomenda” quando chegar o primeiro pacote.</p>
      </div>
    </div>
  )
}

/** Esqueleto com a forma da lista de encomendas. */
export function EsqueletoLista() {
  return (
    <div aria-hidden className="divide-y divide-line">
      {[0, 1, 2, 3].map((n) => (
        <div key={n} className="flex items-center gap-4 px-4 py-4 md:px-6">
          <div className="esqueleto size-14 shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="esqueleto h-5 w-2/3" />
            <div className="esqueleto h-4 w-1/3" />
          </div>
          <div className="esqueleto h-4 w-12" />
        </div>
      ))}
    </div>
  )
}
