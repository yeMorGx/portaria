import { Moon, Sun } from 'lucide-react'
import { useState } from 'react'

type Tema = 'claro' | 'escuro'
const CHAVE = 'portaria.tema'

function temaAtual(): Tema {
  return document.documentElement.dataset.theme === 'dark' ? 'escuro' : 'claro'
}

/** Botão discreto do cabeçalho que alterna entre modo claro e escuro e lembra a escolha neste aparelho. */
export function AlternarTema() {
  const [tema, setTema] = useState<Tema>(temaAtual)
  const proximo: Tema = tema === 'escuro' ? 'claro' : 'escuro'

  function alternar() {
    document.documentElement.dataset.theme = proximo === 'escuro' ? 'dark' : 'light'
    try {
      localStorage.setItem(CHAVE, proximo)
    } catch {
      /* sem armazenamento: vale só nesta sessão */
    }
    setTema(proximo)
  }

  const Icone = tema === 'escuro' ? Sun : Moon
  return (
    <button
      type="button"
      onClick={alternar}
      aria-label={proximo === 'escuro' ? 'Mudar para modo escuro' : 'Mudar para modo claro'}
      title={proximo === 'escuro' ? 'Modo escuro' : 'Modo claro'}
      className="grid size-11 shrink-0 cursor-pointer place-items-center rounded-botao text-muted transition duration-[120ms] hover:bg-s1 hover:text-ink"
    >
      <Icone className="size-5" strokeWidth={1.75} />
    </button>
  )
}
