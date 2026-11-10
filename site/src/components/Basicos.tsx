import { useRef, type ReactNode } from 'react'
import { linkWhatsapp } from '../config'
import { CONDICOES, gsap, useGSAP } from '../lib/gsap'
import type { Selo } from '../lib/marcas'

export function Marca({ claro }: { claro?: boolean }) {
  return (
    <span className={`inline-flex items-center gap-2.5 text-lg font-semibold tracking-[-0.01em] ${claro ? 'text-noite-texto' : ''}`}>
      <span className="grid size-9 place-items-center rounded-lg bg-accent text-on-accent">
        <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M12 3 4 7.2v9.6L12 21l8-4.2V7.2zM4 7.2l8 4.3 8-4.3M12 11.5V21M8 5.1l8 4.3" />
        </svg>
      </span>
      Portaria
    </span>
  )
}

export function SeloMarca({ s, tamanho = 36 }: { s: Selo; tamanho?: number }) {
  return (
    <span
      aria-hidden
      className="grid shrink-0 place-items-center rounded-lg font-bold tracking-[-0.02em]"
      style={{ width: tamanho, height: tamanho, background: s.cor, color: s.texto, fontSize: Math.round(tamanho * 0.36) }}
    >
      {s.sigla}
    </span>
  )
}

/** Botão que abre o WhatsApp; no mouse, é atraído pelo ponteiro (botão magnético). */
export function BotaoDemo({ grande, claro, children = 'Pedir demonstração' }: { grande?: boolean; claro?: boolean; children?: ReactNode }) {
  const ref = useRef<HTMLAnchorElement>(null)
  useGSAP(() => {
    const mm = gsap.matchMedia()
    mm.add(`${CONDICOES.animar} and (hover: hover) and (pointer: fine)`, () => {
      const el = ref.current!
      const x = gsap.quickTo(el, 'x', { duration: 0.5, ease: 'power3' })
      const y = gsap.quickTo(el, 'y', { duration: 0.5, ease: 'power3' })
      const mover = (e: PointerEvent) => {
        const c = el.getBoundingClientRect()
        x((e.clientX - (c.left + c.width / 2)) * 0.3)
        y((e.clientY - (c.top + c.height / 2)) * 0.35)
      }
      const sair = () => {
        x(0)
        y(0)
      }
      el.addEventListener('pointermove', mover)
      el.addEventListener('pointerleave', sair)
      return () => {
        el.removeEventListener('pointermove', mover)
        el.removeEventListener('pointerleave', sair)
      }
    })
  })
  return (
    <a
      ref={ref}
      href={linkWhatsapp()}
      target="_blank"
      rel="noopener"
      className={`inline-flex items-center justify-center gap-3 rounded-full font-semibold tracking-[-0.01em] shadow-[0_1px_2px_rgb(21_21_43/.2),0_10px_24px_-10px_rgb(67_56_202/.7)] transition-colors duration-150 ${
        grande ? 'min-h-16 px-8 text-lg md:min-h-20 md:px-12 md:text-2xl' : 'min-h-12 px-6 text-base'
      } ${claro ? 'bg-acento-noite text-noite hover:bg-white' : 'bg-accent text-on-accent hover:bg-accent-strong'}`}
    >
      {children}
      <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M5 12h14M13 6l6 6-6 6" />
      </svg>
    </a>
  )
}

/** Moldura de celular. As telas ficam empilhadas; as cenas mostram uma de cada vez. */
export function Celular({ telas, className = '', children }: { telas?: Array<{ src: string; alt: string }>; className?: string; children?: ReactNode }) {
  return (
    <div className={`relative aspect-[390/844] w-full rounded-[44px] bg-[#0f0f18] p-[10px] shadow-[0_40px_80px_-30px_rgb(21_21_43/.55),0_0_0_1px_rgb(255_255_255/.06)_inset] ${className}`}>
      <div className="relative size-full overflow-hidden rounded-[34px] bg-bg">
        {telas?.map((t, i) => (
          <img
            key={t.src}
            data-tela={i}
            src={t.src}
            alt={i === 0 ? t.alt : ''}
            loading={i === 0 ? 'eager' : 'lazy'}
            className="absolute inset-0 size-full object-cover object-top"
            style={{ opacity: i === 0 ? 1 : 0 }}
          />
        ))}
        {children}
        <span aria-hidden className="absolute top-2.5 left-1/2 h-6 w-24 -translate-x-1/2 rounded-full bg-[#0f0f18]" />
      </div>
    </div>
  )
}
