import * as Popover from '@radix-ui/react-popover'
import * as ToggleGroup from '@radix-ui/react-toggle-group'
import { Command } from 'cmdk'
import { Check, ChevronsUpDown, Search } from 'lucide-react'
import { useState } from 'react'
import type { Morador } from '../lib/parser'

/** Combobox de morador: busca por nome ou apartamento, teclado e leitor de tela (Radix Popover + cmdk). */
export function SeletorMorador({
  moradores,
  valor,
  aoMudar,
}: {
  moradores: Morador[]
  valor: string
  aoMudar: (id: string) => void
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
          aria-label="Morador"
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
                  <span className="num shrink-0 text-sm text-muted">Apto {m.apartamento}</span>
                </Command.Item>
              ))}
            </Command.List>
          </Command>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}

const TRANSPORTADORAS = ['Correios', 'Mercado Livre', 'Amazon', 'Shopee', 'Jadlog', 'Loggi']

/** Chips das transportadoras mais comuns, mais "Outra" com campo de texto. */
export function SeletorTransportadora({
  valor,
  aoMudar,
}: {
  valor: string
  aoMudar: (v: string) => void
}) {
  const conhecida = TRANSPORTADORAS.includes(valor)
  const [outra, setOutra] = useState(!!valor && !conhecida)
  const selecionado = outra ? 'Outra' : conhecida ? valor : ''

  return (
    <div className="space-y-3">
      <ToggleGroup.Root
        type="single"
        value={selecionado}
        aria-label="Transportadora"
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
        {[...TRANSPORTADORAS, 'Outra'].map((t) => (
          <ToggleGroup.Item
            key={t}
            value={t}
            className="min-h-11 cursor-pointer rounded-full border border-line bg-s2 px-4 text-sm font-medium transition duration-[120ms] hover:bg-s3 data-[state=on]:border-accent data-[state=on]:bg-accent data-[state=on]:text-on-accent"
          >
            {t}
          </ToggleGroup.Item>
        ))}
      </ToggleGroup.Root>
      {outra && (
        <input
          value={valor}
          onChange={(e) => aoMudar(e.target.value)}
          placeholder="Nome da transportadora"
          aria-label="Nome da transportadora"
          className="min-h-12 w-full rounded-botao border border-line bg-s2 px-4 text-base"
        />
      )}
    </div>
  )
}
