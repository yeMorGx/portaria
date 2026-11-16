import * as Popover from '@radix-ui/react-popover'
import * as ToggleGroup from '@radix-ui/react-toggle-group'
import { Command } from 'cmdk'
import { Check, ChevronsUpDown, Minus, Plus, Search } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { LOJAS, TRANSPORTADORAS, type TipoMarca } from '../lib/marcas'
import type { Morador } from '../lib/parser'
import { LogoMarca } from './Logo'

/** Combobox de morador: busca por nome ou apartamento, teclado e leitor de tela (Radix Popover + cmdk). */
export function SeletorMorador({
  moradores,
  valor,
  aoMudar,
  rotulo = 'Morador',
}: {
  moradores: Morador[]
  valor: string
  aoMudar: (id: string) => void
  rotulo?: string
}) {
  const [aberto, setAberto] = useState(false)
  const atual = moradores.find((m) => m.id === valor)

  return (
    <Popover.Root open={aberto} onOpenChange={setAberto}>
      <Popover.Trigger asChild>
        <button
          type="button"
          role="combobox"
          aria-expanded={aberto}
          aria-label={rotulo}
          className="flex min-h-14 w-full cursor-pointer items-center justify-between gap-3 rounded-botao border border-line bg-s2 px-4 text-left text-lg transition duration-[120ms] hover:bg-s3"
        >
          <span className={`min-w-0 truncate ${atual ? 'font-semibold' : 'text-muted'}`}>
            {atual ? atual.nome : 'Selecionar morador'}
          </span>
          <ChevronsUpDown className="size-5 shrink-0 text-muted" strokeWidth={1.75} />
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          sideOffset={8}
          align="start"
          collisionPadding={16}
          className="z-50 w-[var(--radix-popover-trigger-width)] overflow-hidden rounded-botao border border-line bg-s1 shadow-[var(--shadow-overlay)]"
        >
          <Command className="flex flex-col">
            <div className="flex items-center gap-3 border-b border-line px-4 focus-within:bg-accent-soft">
              <Search className="size-5 shrink-0 text-muted" strokeWidth={1.75} />
              <Command.Input
                autoFocus
                placeholder="Buscar por nome ou apartamento"
                aria-label="Buscar morador"
                className="min-h-12 w-full bg-transparent text-base outline-none placeholder:text-muted focus-visible:outline-none"
              />
            </div>
            <Command.List className="max-h-64 overflow-y-auto p-2">
              <Command.Empty className="px-3 py-6 text-center text-muted">Nenhum morador encontrado.</Command.Empty>
              {moradores.map((m) => (
                <Command.Item
                  key={m.id}
                  value={`${m.nome} ${m.apartamento}`}
                  onSelect={() => {
                    aoMudar(m.id)
                    setAberto(false)
                  }}
                  className="flex min-h-12 cursor-pointer items-center justify-between gap-3 rounded-campo px-3 text-base data-[selected=true]:bg-accent-soft"
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <Check
                      className={`size-4 shrink-0 text-accent ${m.id === valor ? 'opacity-100' : 'opacity-0'}`}
                      strokeWidth={2}
                    />
                    <span className="truncate">{m.nome}</span>
                  </span>
                  <span className="num shrink-0 text-sm text-muted">
                    {m.bloco ? `${m.bloco} · ` : ''}Apto {m.apartamento}
                  </span>
                </Command.Item>
              ))}
            </Command.List>
          </Command>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}

const chipBase =
  'inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full border border-line bg-s2 pr-4 pl-2 text-sm font-medium transition duration-[120ms] hover:bg-s3 data-[state=on]:border-accent data-[state=on]:bg-accent-soft data-[state=on]:text-ink data-[state=on]:ring-1 data-[state=on]:ring-accent'

/**
 * Chips de marcas com logo (lojas ou transportadoras), mais "Outra" com campo de texto.
 * Mostra as 8 primeiras e, se a marca escolhida estiver fora delas, também ela.
 */
export function SeletorMarca({
  tipo,
  valor,
  aoMudar,
  rotulo,
}: {
  tipo: TipoMarca
  valor: string
  aoMudar: (v: string) => void
  rotulo: string
}) {
  const todas = tipo === 'loja' ? LOJAS : TRANSPORTADORAS
  const conhecida = todas.some((m) => m.nome === valor)
  const [outra, setOutra] = useState(!!valor && !conhecida)
  const [expandido, setExpandido] = useState(false)
  const selecionado = outra ? 'Outra' : conhecida ? valor : ''
  const visiveis = expandido ? todas : todas.filter((m, i) => i < 8 || m.nome === valor)

  return (
    <div className="space-y-3">
      <ToggleGroup.Root
        type="single"
        value={selecionado}
        aria-label={rotulo}
        className="flex flex-wrap gap-2"
        onValueChange={(v) => {
          if (v === 'Outra') {
            setOutra(true)
            if (conhecida) aoMudar('')
          } else {
            setOutra(false)
            aoMudar(v)
          }
        }}
      >
        {visiveis.map((m) => (
          <ToggleGroup.Item key={m.id} value={m.nome} className={chipBase}>
            <LogoMarca marca={m} tamanho={28} />
            {m.nome}
          </ToggleGroup.Item>
        ))}
        <ToggleGroup.Item value="Outra" className={`${chipBase} pl-4`}>
          Outra
        </ToggleGroup.Item>
      </ToggleGroup.Root>
      {todas.length > 8 && (
        <button
          type="button"
          onClick={() => setExpandido((x) => !x)}
          className="min-h-11 cursor-pointer text-sm font-medium text-accent hover:underline"
        >
          {expandido ? 'Mostrar menos' : `Ver todas (${todas.length})`}
        </button>
      )}
      {outra && (
        <input
          value={valor}
          onChange={(e) => aoMudar(e.target.value)}
          placeholder={`Nome da ${tipo === 'loja' ? 'loja' : 'transportadora'}`}
          aria-label={`Nome da ${tipo === 'loja' ? 'loja' : 'transportadora'}`}
          className="min-h-12 w-full rounded-botao border border-line bg-s2 px-4 text-base"
        />
      )}
    </div>
  )
}

/** Chips de escolha única com ícone opcional. Tocar no escolhido de novo limpa, se `limpavel`. */
export function ChipsUnico<T extends string>({
  valor,
  aoMudar,
  opcoes,
  rotulo,
  limpavel,
}: {
  valor: T | ''
  aoMudar: (v: T | '') => void
  opcoes: Array<{ valor: T; rotulo: string; icone?: ReactNode }>
  rotulo: string
  limpavel?: boolean
}) {
  return (
    <ToggleGroup.Root
      type="single"
      value={valor}
      aria-label={rotulo}
      className="flex flex-wrap gap-2"
      onValueChange={(v) => {
        if (v || limpavel) aoMudar(v as T | '')
      }}
    >
      {opcoes.map((o) => (
        <ToggleGroup.Item key={o.valor} value={o.valor} className={`${chipBase} ${o.icone ? '' : 'pl-4'}`}>
          {o.icone && <span className="grid size-7 place-items-center text-muted">{o.icone}</span>}
          {o.rotulo}
        </ToggleGroup.Item>
      ))}
    </ToggleGroup.Root>
  )
}

export function Contador({
  valor,
  aoMudar,
  rotulo,
}: {
  valor: number
  aoMudar: (n: number) => void
  rotulo: string
}) {
  const botao =
    'grid size-11 cursor-pointer place-items-center rounded-botao border border-line bg-s2 transition duration-[120ms] hover:bg-s3 disabled:cursor-not-allowed disabled:opacity-40'
  return (
    <div className="inline-flex items-center gap-3" role="group" aria-label={rotulo}>
      <button type="button" className={botao} aria-label="Diminuir" disabled={valor <= 1} onClick={() => aoMudar(valor - 1)}>
        <Minus className="size-5" strokeWidth={1.75} />
      </button>
      <span className="num min-w-8 text-center text-2xl font-medium" aria-live="polite">
        {valor}
      </span>
      <button type="button" className={botao} aria-label="Aumentar" disabled={valor >= 99} onClick={() => aoMudar(valor + 1)}>
        <Plus className="size-5" strokeWidth={1.75} />
      </button>
    </div>
  )
}
