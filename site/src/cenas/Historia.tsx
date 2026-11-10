import { useRef } from 'react'
import { SeloMarca } from '../components/Basicos'
import { CONDICOES, gsap, useGSAP } from '../lib/gsap'
import { porNome } from '../lib/marcas'

const ANOTACOES = [
  ['12/11', 'Maria F. — ap 202', 'Correios'],
  ['12/11', 'João C. — ap 101 (?)', 'caixa grande'],
  ['13/11', 'Bia — 505', 'Shopee'],
  ['13/11', 'José A. 404 — entregue?', '—'],
  ['14/11', 'Ana P. 303', 'deixado c/ vizinho'],
  ['14/11', '???  — sem nome', 'Amazon'],
]

const PERGUNTAS = ['Quem recebeu?', 'Onde está o pacote?', 'Já foi entregue? A quem?']

/** Cena 2: a caderneta é riscada linha a linha enquanto surgem as perguntas sem resposta. */
export function Problema() {
  const raiz = useRef<HTMLElement>(null)
  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      mm.add({ animar: CONDICOES.animar, grande: CONDICOES.grande }, (ctx) => {
        const { animar, grande } = ctx.conditions as { animar: boolean; grande: boolean }
        if (!animar) return
        gsap
          .timeline({
            defaults: { ease: 'none' },
            scrollTrigger: grande
              ? { trigger: raiz.current, start: 'top top', end: '+=180%', scrub: 0.6, pin: true }
              : { trigger: raiz.current, start: 'top 75%', end: 'bottom 65%', scrub: 0.6 },
          })
          .from('[data-pagina]', { rotate: -8, y: 80, opacity: 0, duration: 0.6, ease: 'power2.out' })
          .from('[data-risco]', { drawSVG: '0%', duration: 0.35, stagger: 0.3 }, '>')
          .fromTo('[data-pergunta]', { opacity: 0.12 }, { opacity: 1, duration: 0.3, stagger: 0.55 }, 0.8)
          .to('[data-pagina]', { rotate: 6, scale: 0.86, opacity: 0.25, duration: 0.6, ease: 'power2.in' }, '>0.2')
          .from('[data-virada]', { y: 40, opacity: 0, filter: 'blur(10px)', duration: 0.6, ease: 'power2.out' }, '<0.2')
      })
    },
    { scope: raiz },
  )

  return (
    <section ref={raiz} id="problema" className="relative overflow-hidden px-4 py-24 md:px-8 lg:flex lg:h-[100svh] lg:items-center lg:py-0">
      <div className="mx-auto grid w-full max-w-[1240px] items-center gap-12 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <p className="rotulo mb-5 text-accent">O problema</p>
          <h2 className="text-[clamp(36px,6vw,72px)] leading-[0.98] font-semibold tracking-[-0.04em]">
            Na caderneta, ninguém sabe ao certo.
          </h2>
          <ul className="mt-10 space-y-4">
            {PERGUNTAS.map((p) => (
              <li key={p} data-pergunta className="flex items-baseline gap-4 text-[clamp(22px,3vw,34px)] leading-tight font-medium tracking-[-0.02em]">
                <span className="num text-base text-accent">?</span>
                {p}
              </li>
            ))}
          </ul>
          <p data-virada className="mt-10 max-w-md text-lg text-muted">
            Papel não avisa o morador, não guarda foto e não diz quem entregou.
          </p>
        </div>
        <div className="lg:col-span-7">
          <div data-pagina className="relative mx-auto max-w-[620px] rotate-[-1.5deg] rounded-sm bg-[#fbf8ef] px-6 py-8 shadow-[0_30px_60px_-30px_rgb(21_21_43/.45)] md:px-10">
            <div aria-hidden className="absolute inset-y-0 left-12 w-px bg-[#e8a0a0] md:left-16" />
            <p className="rotulo mb-5 pl-10 text-[#8a7f66] md:pl-12">Encomendas — portaria</p>
            <ul aria-label="Anotações da caderneta" className="relative">
              {ANOTACOES.map((a, i) => (
                <li key={i} className="relative grid grid-cols-[3.5rem_1fr_auto] items-center gap-3 border-b border-[#d9e3f0] py-3 pl-2 font-mono text-[13px] text-[#3b3a4a] italic md:pl-4 md:text-[15px]">
                  <span>{a[0]}</span>
                  <span>{a[1]}</span>
                  <span className="text-[#7a7a8a]">{a[2]}</span>
                  <svg aria-hidden className="pointer-events-none absolute inset-x-0 top-1/2 h-6 w-full -translate-y-1/2 overflow-visible" viewBox="0 0 100 10" preserveAspectRatio="none">
                    <path data-risco d={`M2 ${5 + (i % 2 ? 1 : -1)} C 30 ${3 + i % 3}, 60 ${7 - i % 3}, 98 ${5 + (i % 2 ? -1 : 1)}`} fill="none" stroke="#c0392b" strokeWidth="1.6" vectorEffect="non-scaling-stroke" strokeLinecap="round" />
                  </svg>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}

const CAMPOS = [
  { id: 'transportadora', etiqueta: 'CORREIOS · SEDEX', rotulo: 'Transportadora' },
  { id: 'rastreio', etiqueta: 'AB123456789BR', rotulo: 'Rastreio' },
  { id: 'nome', etiqueta: 'MARIA FERNANDA OLIVEIRA', rotulo: 'Destinatário' },
  { id: 'apto', etiqueta: 'APTO 202 · BLOCO A', rotulo: 'Apartamento' },
  { id: 'loja', etiqueta: 'MERCADO LIVRE', rotulo: 'Loja' },
]

/** Cena 3: o laser lê a etiqueta e cada campo voa até o cartão do pedido (o real vira dado). */
export function RealDado() {
  const raiz = useRef<HTMLElement>(null)
  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      mm.add({ animar: CONDICOES.animar, grande: CONDICOES.grande }, (ctx) => {
        const { animar, grande } = ctx.conditions as { animar: boolean; grande: boolean }
        if (!animar) return
        const q = gsap.utils.selector(raiz)
        const delta = (id: string, eixo: 'x' | 'y') => () => {
          const o = q(`[data-origem="${id}"]`)[0]?.getBoundingClientRect()
          const d = q(`[data-destino="${id}"]`)[0]?.getBoundingClientRect()
          if (!o || !d) return 0
          return eixo === 'x' ? o.left - d.left : o.top - d.top
        }
        const tl = gsap.timeline({
          defaults: { ease: 'none' },
          scrollTrigger: grande
            ? { trigger: raiz.current, start: 'top top', end: '+=220%', scrub: 0.6, pin: true, invalidateOnRefresh: true }
            : { trigger: raiz.current, start: 'top 60%', end: 'bottom 80%', scrub: 0.6, invalidateOnRefresh: true },
        })
        tl.from('[data-caixa]', { y: 60, rotate: -6, opacity: 0, duration: 0.5, ease: 'power2.out' })
          .fromTo('[data-laser]', { top: '0%', opacity: 1 }, { top: '100%', duration: 0.9 })
          .to('[data-laser]', { opacity: 0, duration: 0.1 })
          .from('[data-cartao]', { opacity: 0, y: 30, duration: 0.3 }, '<')
        CAMPOS.forEach((c, i) => {
          tl.to(q(`[data-origem="${c.id}"]`), { backgroundColor: 'rgba(139,132,245,.28)', duration: 0.12 }, 0.6 + i * 0.16)
          tl.from(
            q(`[data-destino="${c.id}"]`),
            { x: delta(c.id, 'x'), y: delta(c.id, 'y'), scale: 0.85, opacity: 0, duration: 0.5, ease: 'power2.inOut' },
            1.55 + i * 0.12,
          )
        })
        tl.from('[data-logos] > *', { scale: 0, rotate: -20, duration: 0.3, stagger: 0.1, ease: 'back.out(2)' }, '>-0.1')
          .from('[data-extra]', { opacity: 0, y: 10, duration: 0.3, stagger: 0.08 }, '<')
      })
    },
    { scope: raiz },
  )

  const ml = porNome('Mercado Livre')!
  const correios = porNome('Correios')!

  return (
    <section ref={raiz} id="como-funciona" className="relative overflow-hidden bg-s2 px-4 py-24 md:px-8 lg:flex lg:h-[100svh] lg:items-center lg:py-0">
      <div className="mx-auto w-full max-w-[1240px]">
        <div className="mb-12 max-w-2xl lg:mb-16">
          <p className="rotulo mb-5 text-accent">1 · Recebe</p>
          <h2 className="text-[clamp(36px,6vw,72px)] leading-[0.98] font-semibold tracking-[-0.04em]">A etiqueta vira registro.</h2>
          <p className="mt-5 text-lg text-muted">O app lê a etiqueta e preenche o pedido: morador, apartamento, loja, transportadora e rastreio.</p>
        </div>
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
          {/* Caixa com etiqueta */}
          <div data-caixa className="relative mx-auto w-full max-w-[460px]">
            <div className="relative rounded-[18px] bg-[#c8a26b] p-6 shadow-[0_40px_60px_-30px_rgb(80_50_10/.6)] md:p-8" style={{ transform: 'perspective(900px) rotateX(8deg) rotateY(-10deg)' }}>
              <div aria-hidden className="absolute inset-x-0 top-[38%] h-5 bg-[#b48b52]/70" />
              <div className="relative overflow-hidden rounded-md border-2 border-[#1d1d1d] bg-[#fbfaf6] p-4 md:p-5">
                <div data-laser className="absolute inset-x-0 h-[3px] bg-[#8b84f5] shadow-[0_0_18px_4px_rgb(139_132_245/.8)]" style={{ top: '0%', opacity: 0 }} />
                <div className="mb-3 flex items-center justify-between">
                  <span className="font-mono text-[10px] font-bold tracking-widest text-[#1d1d1d]">DESTINATÁRIO</span>
                  <svg viewBox="0 0 60 20" className="h-5 w-16" aria-hidden>
                    {Array.from({ length: 22 }, (_, i) => (
                      <rect key={i} x={i * 2.7} y="0" width={i % 3 ? 1.2 : 2} height="20" fill="#1d1d1d" />
                    ))}
                  </svg>
                </div>
                <ul className="space-y-1.5" aria-label="Campos da etiqueta">
                  {CAMPOS.map((c) => (
                    <li key={c.id} data-origem={c.id} className="rounded px-1 font-mono text-[13px] font-bold text-[#1d1d1d] md:text-[15px]">
                      {c.etiqueta}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Cartão do pedido, igual ao do app */}
          <div data-cartao className="tile mx-auto w-full max-w-[520px] p-6 md:p-8">
            <div className="flex gap-5">
              <div data-logos className="relative h-14 w-[74px] shrink-0">
                <SeloMarca s={ml} tamanho={56} />
                <span className="absolute -right-0 -bottom-1 rounded-lg ring-2 ring-[var(--surface-1)]">
                  <SeloMarca s={correios} tamanho={34} />
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <p data-destino="nome" className="text-2xl leading-tight font-semibold tracking-[-0.02em]">
                  Maria Fernanda Oliveira
                </p>
                <p data-destino="apto" className="mt-1 text-muted">
                  Bloco A · Apto <span className="num font-medium text-ink">202</span>
                </p>
              </div>
            </div>
            <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-4 border-t border-line pt-6 text-sm">
              {[
                ['loja', 'Comprado em', 'Mercado Livre'],
                ['transportadora', 'Entrega', 'Correios'],
                ['rastreio', 'Rastreio', 'AB123456789BR'],
              ].map(([id, rot, val]) => (
                <div key={id} data-destino={id}>
                  <dt className="rotulo text-muted">{rot}</dt>
                  <dd className={`m-0 mt-1 text-base font-medium ${id === 'rastreio' ? 'num' : ''}`}>{val}</dd>
                </div>
              ))}
              <div data-extra>
                <dt className="rotulo text-muted">Guardado em</dt>
                <dd className="m-0 mt-1 text-base font-medium">Prateleira A</dd>
              </div>
            </dl>
            <p data-extra className="mt-6 flex items-center gap-2 rounded-xl bg-accent-soft px-4 py-3 text-sm">
              <span className="pulsar size-2 rounded-full bg-accent" />
              Recebida às <span className="num">10:42</span> por Carlos · morador avisado
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
