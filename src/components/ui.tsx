import type { ButtonHTMLAttributes, ReactNode } from 'react'

type Variante = 'primario' | 'secundario' | 'fantasma'

const estilos: Record<Variante, string> = {
  primario: 'bg-brand text-white hover:bg-brand-strong active:scale-[.98] dark:text-[#06231d]',
  secundario: 'bg-card text-ink border border-line hover:border-brand active:scale-[.98]',
  fantasma: 'text-muted hover:text-ink',
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
      className={`inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${
        grande ? 'min-h-16 px-8 text-xl' : 'min-h-12 px-5 text-base'
      } ${estilos[variante]} ${className}`}
    />
  )
}

export function Cabecalho({ titulo, voltar, direita }: { titulo: string; voltar?: () => void; direita?: ReactNode }) {
  return (
    <header className="mb-8 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        {voltar && (
          <Botao variante="fantasma" onClick={voltar} aria-label="Voltar" className="!px-3">
            ← Voltar
          </Botao>
        )}
        <h1 className="text-2xl font-bold tracking-tight">{titulo}</h1>
      </div>
      {direita}
    </header>
  )
}

export function Aviso({ children }: { children: ReactNode }) {
  return (
    <p role="alert" className="rounded-lg border border-danger/40 bg-danger/10 px-4 py-3 text-danger">
      {children}
    </p>
  )
}
