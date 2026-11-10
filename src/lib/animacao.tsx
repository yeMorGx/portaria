import { MotionConfig } from 'motion/react'
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { gsap } from './gsap'

export type PreferenciaAnimacao = 'sistema' | 'ligadas' | 'desligadas'

const CHAVE = 'portaria.animacoes'

function lerPreferencia(): PreferenciaAnimacao {
  try {
    const v = localStorage.getItem(CHAVE)
    return v === 'ligadas' || v === 'desligadas' ? v : 'sistema'
  } catch {
    return 'sistema'
  }
}

interface Contexto {
  preferencia: PreferenciaAnimacao
  definir: (p: PreferenciaAnimacao) => void
  /** true quando as animações devem ser desligadas (escolha do usuário ou configuração do sistema). */
  reduzir: boolean
}

const Ctx = createContext<Contexto>({ preferencia: 'sistema', definir: () => {}, reduzir: false })

/**
 * Uma única fonte de verdade para o movimento: Motion, GSAP e as animações em CSS seguem o mesmo valor.
 * "Sistema" respeita a configuração do Windows ou do celular; "Ligadas" e "Desligadas" são escolhas do usuário.
 */
export function AnimacaoProvider({ children }: { children: ReactNode }) {
  const [preferencia, setPreferencia] = useState<PreferenciaAnimacao>(lerPreferencia)
  const [sistemaReduz, setSistemaReduz] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches)

  useEffect(() => {
    const m = window.matchMedia('(prefers-reduced-motion: reduce)')
    const aoMudar = () => setSistemaReduz(m.matches)
    m.addEventListener('change', aoMudar)
    return () => m.removeEventListener('change', aoMudar)
  }, [])

  const reduzir = preferencia === 'desligadas' || (preferencia === 'sistema' && sistemaReduz)

  useEffect(() => {
    document.documentElement.dataset.animacoes = reduzir ? 'reduzidas' : 'completas'
    // Com animações desligadas, as linhas do tempo do GSAP terminam na hora, sem deixar nada escondido.
    gsap.globalTimeline.timeScale(reduzir ? 100 : 1)
  }, [reduzir])

  const valor = useMemo<Contexto>(
    () => ({
      preferencia,
      reduzir,
      definir: (p) => {
        setPreferencia(p)
        try {
          localStorage.setItem(CHAVE, p)
        } catch {
          /* sem armazenamento: vale só nesta sessão */
        }
      },
    }),
    [preferencia, reduzir],
  )

  return (
    <Ctx.Provider value={valor}>
      <MotionConfig reducedMotion={preferencia === 'ligadas' ? 'never' : preferencia === 'desligadas' ? 'always' : 'user'}>
        {children}
      </MotionConfig>
    </Ctx.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAnimacao() {
  return useContext(Ctx)
}
