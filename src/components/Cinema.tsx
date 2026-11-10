import { Package } from 'lucide-react'
import { forwardRef, useImperativeHandle, useRef, type ReactNode } from 'react'
import { gsap, SplitText, useGSAP } from '../lib/gsap'

const FAIXAS = 6

export interface CortinaApi {
  /** Cobre a tela com as faixas, executa `aoMeio` quando ela está coberta e depois revela a tela nova. */
  cobrir: (aoMeio: () => void) => void
}

/** Cortina de faixas verticais que escondem a troca de tela (referência: transições de página do Awwwards). */
export const Cortina = forwardRef<CortinaApi>(function Cortina(_, ref) {
  const raiz = useRef<HTMLDivElement>(null)
  const ocupada = useRef(false)

  useImperativeHandle(ref, () => ({
    cobrir(aoMeio) {
      const faixas = raiz.current?.querySelectorAll('[data-faixa]')
      if (!faixas || ocupada.current) {
        aoMeio()
        return
      }
      ocupada.current = true
      gsap
        .timeline({ onComplete: () => void (ocupada.current = false) })
        .set(raiz.current, { autoAlpha: 1 })
        .fromTo(
          faixas,
          { scaleY: 0, transformOrigin: '50% 100%' },
          { scaleY: 1, duration: 0.34, ease: 'power4.inOut', stagger: { each: 0.045, from: 'start' } },
        )
        .call(aoMeio)
        .to(faixas, {
          scaleY: 0,
          transformOrigin: '50% 0%',
          duration: 0.46,
          ease: 'power4.inOut',
          stagger: { each: 0.045, from: 'start' },
          delay: 0.06,
        })
        .set(raiz.current, { autoAlpha: 0 })
    },
  }))

  return (
    <div ref={raiz} aria-hidden className="pointer-events-none invisible fixed inset-0 z-[60] flex">
      {Array.from({ length: FAIXAS }, (_, i) => (
        <div key={i} data-faixa className={`h-full flex-1 ${i % 2 ? 'bg-accent-strong' : 'bg-accent'}`} style={{ transform: 'scaleY(0)' }} />
      ))}
    </div>
  )
})

/** Abertura do app: palavra gigante que sobe letra por letra, contador e barra de progresso. */
export function Abertura() {
  const raiz = useRef<HTMLElement>(null)
  const numero = useRef<HTMLSpanElement>(null)

  useGSAP(
    () => {
      const palavra = SplitText.create('[data-palavra]', { type: 'words,chars', mask: 'chars' })
      const cont = { v: 0 }
      gsap
        .timeline()
        .from(palavra.chars, { yPercent: 115, rotate: 6, duration: 0.9, ease: 'expo.out', stagger: 0.045 })
        .from('[data-selo]', { scale: 0.4, rotate: -90, opacity: 0, duration: 0.8, ease: 'back.out(1.8)' }, 0.1)
        .from('[data-linha-progresso]', { scaleX: 0, transformOrigin: '0 50%', duration: 1, ease: 'power3.inOut' }, 0.1)
        .to(
          cont,
          {
            v: 100,
            duration: 1,
            ease: 'power3.inOut',
            onUpdate: () => {
              if (numero.current) numero.current.textContent = String(Math.round(cont.v)).padStart(3, '0')
            },
          },
          0.1,
        )
        .from('[data-sub]', { y: 16, opacity: 0, duration: 0.6, ease: 'expo.out' }, 0.5)
    },
    { scope: raiz },
  )

  return (
    <main ref={raiz} className="relative grid min-h-screen overflow-hidden px-6 py-8" role="status" aria-label="Carregando">
      <div className="flex items-start justify-between">
        <span data-selo className="grid size-11 place-items-center rounded-botao bg-accent text-on-accent">
          <Package className="size-6" strokeWidth={1.75} />
        </span>
        <span data-sub className="rotulo">
          Registro de encomendas
        </span>
      </div>
      <h1
        data-palavra
        className="m-0 self-center text-[clamp(64px,22vw,220px)] leading-[0.9] font-semibold tracking-[-0.05em]"
      >
        Portaria
      </h1>
      <div className="self-end">
        <div className="mb-3 flex items-end justify-between">
          <span ref={numero} className="num text-5xl leading-none font-medium tracking-[-0.04em] md:text-7xl">
            000
          </span>
          <span className="rotulo">Carregando</span>
        </div>
        <div className="h-px w-full bg-line">
          <div data-linha-progresso className="h-full w-full bg-accent" />
        </div>
      </div>
    </main>
  )
}

/** Título grande cujas letras sobem de dentro de uma máscara. */
export function TituloLetras({ children, className = '' }: { children: string; className?: string }) {
  const raiz = useRef<HTMLSpanElement>(null)
  useGSAP(
    () => {
      const d = SplitText.create(raiz.current!, { type: 'words,chars', mask: 'chars' })
      gsap.from(d.chars, { yPercent: 118, rotate: 5, duration: 0.95, ease: 'expo.out', stagger: 0.03, delay: 0.65 })
    },
    { scope: raiz },
  )
  return (
    <span ref={raiz} className={className} aria-label={children}>
      {children}
    </span>
  )
}

/** Número que sobe até o valor novo (sem mexer no texto lido por testes: o valor final é sempre o do React). */
export function NumeroAnimado({
  valor,
  className,
  testid,
}: {
  valor: number
  className?: string
  testid?: string
}) {
  const ref = useRef<HTMLParagraphElement>(null)
  const anterior = useRef(0)
  useGSAP(
    () => {
      const o = { v: anterior.current }
      const primeira = anterior.current === 0
      anterior.current = valor
      gsap.to(o, {
        v: valor,
        delay: primeira ? 0.75 : 0,
        duration: 1.1,
        ease: 'power3.out',
        onUpdate: () => {
          if (ref.current) ref.current.textContent = String(Math.round(o.v))
        },
        onComplete: () => {
          if (ref.current) ref.current.textContent = String(valor)
        },
      })
    },
    { dependencies: [valor] },
  )
  return (
    <p ref={ref} className={className} data-testid={testid}>
      {valor}
    </p>
  )
}

/** Celebração da entrega: o círculo abre, o visto é desenhado e o texto sobe letra por letra. */
export function Celebracao({
  titulo,
  subtitulo,
  aoMeio,
  aoFim,
}: {
  titulo: string
  subtitulo?: string
  aoMeio: () => void
  aoFim: () => void
}) {
  const raiz = useRef<HTMLDivElement>(null)
  useGSAP(
    () => {
      const letras = SplitText.create('[data-celebracao-titulo]', { type: 'words,chars', mask: 'chars' })
      gsap
        .timeline({ onComplete: aoFim })
        .fromTo(raiz.current, { clipPath: 'circle(0% at 50% 55%)' }, { clipPath: 'circle(150% at 50% 55%)', duration: 0.75, ease: 'power3.inOut' })
        .from('[data-anel]', { drawSVG: '0%', duration: 0.55, ease: 'power2.out' }, 0.35)
        .from('[data-visto]', { drawSVG: '0%', duration: 0.4, ease: 'power2.out' }, '>-0.1')
        .from('[data-pulso]', { scale: 0.6, opacity: 0.7, duration: 0.7, ease: 'expo.out' }, '<')
        .to('[data-pulso]', { opacity: 0, duration: 0.5 }, '<0.2')
        .from(letras.chars, { yPercent: 115, rotate: 4, duration: 0.7, ease: 'expo.out', stagger: 0.03 }, 0.7)
        .from('[data-celebracao-sub]', { y: 14, opacity: 0, duration: 0.5, ease: 'expo.out' }, '>-0.3')
        .to({}, { duration: 0.6 })
        .call(aoMeio)
        .to(raiz.current, { autoAlpha: 0, duration: 0.5, ease: 'power2.inOut' })
    },
    { scope: raiz },
  )
  return (
    <div
      ref={raiz}
      role="status"
      className="fixed inset-0 z-[70] grid place-items-center bg-accent px-6 text-center text-on-accent"
      style={{ clipPath: 'circle(0% at 50% 55%)' }}
    >
      <div className="flex flex-col items-center gap-8">
        <div className="relative grid size-32 place-items-center">
          <span data-pulso className="absolute inset-0 rounded-full bg-on-accent/20" />
          <svg viewBox="0 0 100 100" className="relative size-32" fill="none" stroke="currentColor" strokeWidth={4} strokeLinecap="round" strokeLinejoin="round">
            <circle data-anel cx="50" cy="50" r="44" />
            <path data-visto d="M30 52 L44 66 L71 36" />
          </svg>
        </div>
        <h2 data-celebracao-titulo className="m-0 text-[clamp(40px,10vw,96px)] leading-none font-semibold tracking-[-0.04em]">
          {titulo}
        </h2>
        {subtitulo && (
          <p data-celebracao-sub className="m-0 max-w-md text-lg text-on-accent/80">
            {subtitulo}
          </p>
        )}
      </div>
    </div>
  )
}

/** Holofote: um brilho que segue o ponteiro dentro do tile e o inclina de leve (só mouse). */
export function Holofote({ children, className = '' }: { children: ReactNode; className?: string }) {
  const raiz = useRef<HTMLDivElement>(null)
  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      mm.add('(hover: hover) and (pointer: fine)', () => {
        const el = raiz.current!
        const rx = gsap.quickTo(el, 'rotationX', { duration: 0.6, ease: 'power3' })
        const ry = gsap.quickTo(el, 'rotationY', { duration: 0.6, ease: 'power3' })
        gsap.set(el, { transformPerspective: 900 })
        const mover = (e: PointerEvent) => {
          const c = el.getBoundingClientRect()
          const x = (e.clientX - c.left) / c.width
          const y = (e.clientY - c.top) / c.height
          el.style.setProperty('--mx', `${x * 100}%`)
          el.style.setProperty('--my', `${y * 100}%`)
          ry((x - 0.5) * 5)
          rx(-(y - 0.5) * 5)
        }
        const sair = () => {
          rx(0)
          ry(0)
        }
        el.addEventListener('pointermove', mover)
        el.addEventListener('pointerleave', sair)
        return () => {
          el.removeEventListener('pointermove', mover)
          el.removeEventListener('pointerleave', sair)
        }
      })
    },
    { scope: raiz },
  )
  return (
    <div ref={raiz} className={`holofote ${className}`}>
      {children}
    </div>
  )
}
