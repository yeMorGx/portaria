import * as Popover from '@radix-ui/react-popover'
import * as ToggleGroup from '@radix-ui/react-toggle-group'
import { Sparkles } from 'lucide-react'
import { useAnimacao, type PreferenciaAnimacao } from '../lib/animacao'

const OPCOES: Array<{ valor: PreferenciaAnimacao; rotulo: string; ajuda: string }> = [
  { valor: 'sistema', rotulo: 'Automático', ajuda: 'Segue a configuração do aparelho' },
  { valor: 'ligadas', rotulo: 'Sempre animar', ajuda: 'Animações completas' },
  { valor: 'desligadas', rotulo: 'Sem animações', ajuda: 'Tudo aparece na hora' },
]

/** Botão do cabeçalho para ligar ou desligar as animações do app. */
export function ControleAnimacao() {
  const { preferencia, definir, reduzir } = useAnimacao()
  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <button
          type="button"
          aria-label="Animações"
          title={reduzir ? 'Animações desligadas' : 'Animações ligadas'}
          className={`grid size-11 cursor-pointer place-items-center rounded-botao transition duration-[120ms] hover:bg-s2 ${
            reduzir ? 'text-muted' : 'text-accent'
          }`}
        >
          <Sparkles className="size-5" strokeWidth={1.75} />
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          align="end"
          sideOffset={8}
          collisionPadding={16}
          className="z-50 w-72 rounded-botao border border-line bg-s1 p-2 shadow-[var(--shadow-overlay)]"
        >
          <p className="rotulo m-0 px-3 pt-2 pb-2">Animações</p>
          <ToggleGroup.Root
            type="single"
            value={preferencia}
            aria-label="Animações"
            onValueChange={(v) => v && definir(v as PreferenciaAnimacao)}
            className="flex flex-col gap-1"
          >
            {OPCOES.map((o) => (
              <ToggleGroup.Item
                key={o.valor}
                value={o.valor}
                className="flex min-h-12 cursor-pointer flex-col items-start justify-center rounded-campo px-3 text-left transition duration-[120ms] hover:bg-s2 data-[state=on]:bg-accent-soft"
              >
                <span className="text-base font-medium">{o.rotulo}</span>
                <span className="text-sm text-muted">{o.ajuda}</span>
              </ToggleGroup.Item>
            ))}
          </ToggleGroup.Root>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}
