import { Check } from 'lucide-react'
import { forwardRef, useImperativeHandle, useRef, type ReactNode } from 'react'
import { useAnimacao } from '../lib/animacao'
import { gsap, useGSAP } from '../lib/gsap'

export interface VisorApi {
  /** Flash de obturador com "estalo" da moldura. Resolve quando o flash termina. */
  flash: () => Promise<void>
  /** "Travar no alvo": a moldura fecha, fica verde e aparece o visto. Resolve quando termina. */
  travar: () => Promise<void>
}

const CANTO = 'absolute size-9 border-current'
const VERDE = '#34d399'

/**
 * Visor da câmera: fundo escurecido fora da moldura, cantos que convergem, laser varrendo,
 * flash ao fotografar e "travar no alvo" ao ler um código.
 */
export const Visor = forwardRef<VisorApi, { modo: 'foto' | 'codigo'; dica: string; children: ReactNode }>(function Visor(
  { modo, dica, children },
  ref,
) {
  const raiz = useRef<HTMLDivElement>(null)
  const { reduzir } = useAnimacao()

  useGSAP(
    () => {
      // Cantos entram de fora para dentro, e o laser varre a moldura sem parar.
      gsap.from('[data-canto]', { scale: 1.9, opacity: 0, duration: 0.85, ease: 'expo.out', stagger: 0.06 })
      gsap.from('[data-dica]', { y: 12, opacity: 0, duration: 0.6, ease: 'expo.out', delay: 0.4 })
      if (reduzir) {
        gsap.set('[data-laser]', { top: '50%' })
        return
      }
      gsap.fromTo(
        '[data-laser]',
        { top: '3%' },
        { top: '97%', duration: modo === 'codigo' ? 1.3 : 1.8, ease: 'sine.inOut', yoyo: true, repeat: -1 },
      )
    },
    { scope: raiz, dependencies: [reduzir, modo] },
  )

  useImperativeHandle(ref, () => ({
    flash() {
      const q = (s: string) => raiz.current!.querySelectorAll(s)
      return new Promise<void>((ok) => {
        gsap
          .timeline({ onComplete: () => ok() })
          .to(q('[data-flash]'), { opacity: 0.92, duration: 0.05, ease: 'power1.out' })
          .to(q('[data-janela]'), { scale: 0.95, duration: 0.07, ease: 'power2.out' }, 0)
          .to(q('[data-flash]'), { opacity: 0, duration: 0.3, ease: 'power2.out' })
          .to(q('[data-janela]'), { scale: 1, duration: 0.5, ease: 'back.out(2.4)' }, '<')
          .to({}, { duration: 0.12 })
      })
    },
    travar() {
      const q = (s: string) => raiz.current!.querySelectorAll(s)
      return new Promise<void>((ok) => {
        gsap
          .timeline({ onComplete: () => ok() })
          .to(q('[data-laser]'), { opacity: 0, duration: 0.15 })
          .to(q('[data-janela]'), { color: VERDE, scale: 0.92, duration: 0.22, ease: 'power3.out' }, 0)
          .to(q('[data-janela]'), { scale: 1, duration: 0.45, ease: 'back.out(2.2)' })
          .fromTo(q('[data-visto]'), { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.4, ease: 'back.out(2.6)' }, '<')
          .to({}, { duration: 0.35 })
      })
    },
  }))

  return (
    <div ref={raiz} className="tile relative overflow-hidden !border-0 bg-black">
      <div className="relative aspect-[4/3] bg-black md:aspect-video">
        {children}

        <div
          data-janela
          className={`absolute text-white ${
            modo === 'codigo' ? 'inset-x-[12%] inset-y-[26%] md:inset-x-[28%]' : 'inset-[8%] md:inset-x-[16%] md:inset-y-[10%]'
          }`}
          style={{ boxShadow: '0 0 0 9999px rgb(0 0 0 / 0.5)' }}
        >
          <span data-canto className={`${CANTO} top-0 left-0 rounded-tl-2xl border-t-[3px] border-l-[3px]`} />
          <span data-canto className={`${CANTO} top-0 right-0 rounded-tr-2xl border-t-[3px] border-r-[3px]`} />
          <span data-canto className={`${CANTO} bottom-0 left-0 rounded-bl-2xl border-b-[3px] border-l-[3px]`} />
          <span data-canto className={`${CANTO} right-0 bottom-0 rounded-br-2xl border-r-[3px] border-b-[3px]`} />
          <span
            data-laser
            className="absolute inset-x-2 h-[2px] rounded-full bg-[#a5a0ff]"
            style={{ boxShadow: '0 0 18px 4px rgb(139 132 245 / 0.85)' }}
          />
          <span
            data-visto
            className="absolute top-1/2 left-1/2 grid size-16 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-[#34d399] text-black opacity-0"
          >
            <Check className="size-9" strokeWidth={2.5} />
          </span>
        </div>

        <div
          data-dica
          className="absolute inset-x-0 bottom-3 mx-auto flex w-max max-w-[90%] items-center gap-2 rounded-full bg-black/60 px-3.5 py-1.5 text-xs text-white backdrop-blur"
        >
          <span className="pulsar size-2 rounded-full bg-[#34d399]" />
          {dica}
        </div>

        <div data-flash className="pointer-events-none absolute inset-0 bg-white opacity-0" />
      </div>
    </div>
  )
})
