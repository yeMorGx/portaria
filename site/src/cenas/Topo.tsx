import { useRef, useState } from 'react'
import inicio from '../assets/telas/inicio.jpg'
import { BotaoDemo, Celular, Marca, SeloMarca } from '../components/Basicos'
import { CONDICOES, gsap, ScrollTrigger, SplitText, useGSAP } from '../lib/gsap'
import { porNome } from '../lib/marcas'

const CHAVE = 'portaria.site.abertura'

export function precisaAbertura(): boolean {
  if (window.matchMedia(CONDICOES.reduzir).matches) return false
  try {
    return !sessionStorage.getItem(CHAVE)
  } catch {
    return true
  }
}

/** Abertura: "Portaria" gigante, contador e cortina de faixas. Só na primeira visita da sessão. */
export function Abertura({ aoFim }: { aoFim: () => void }) {
  const raiz = useRef<HTMLDivElement>(null)
  const numero = useRef<HTMLSpanElement>(null)
  const [fim, setFim] = useState(false)

  useGSAP(
    () => {
      document.documentElement.style.overflow = 'hidden'
      const palavra = SplitText.create('[data-palavra]', { type: 'chars', mask: 'chars' })
      const cont = { v: 0 }
      gsap
        .timeline({
          onComplete: () => {
            document.documentElement.style.overflow = ''
            try {
              sessionStorage.setItem(CHAVE, '1')
            } catch {
              /* sem armazenamento: a abertura aparece de novo na próxima visita */
            }
            setFim(true)
          },
        })
        .from(palavra.chars, { yPercent: 115, rotate: 6, duration: 0.9, ease: 'expo.out', stagger: 0.045 })
        .from('[data-progresso]', { scaleX: 0, transformOrigin: '0 50%', duration: 1, ease: 'power3.inOut' }, 0.1)
        .to(cont, { v: 100, duration: 1, ease: 'power3.inOut', onUpdate: () => void (numero.current && (numero.current.textContent = String(Math.round(cont.v)).padStart(3, '0'))) }, 0.1)
        .fromTo('[data-faixa]', { scaleY: 0, transformOrigin: '50% 100%' }, { scaleY: 1, duration: 0.45, ease: 'power4.inOut', stagger: 0.05 }, '+=0.1')
        .set('[data-conteudo-abertura]', { autoAlpha: 0 })
        .set(raiz.current, { backgroundColor: 'transparent' })
        .call(aoFim)
        .to('[data-faixa]', { scaleY: 0, transformOrigin: '50% 0%', duration: 0.6, ease: 'power4.inOut', stagger: 0.05 })
    },
    { scope: raiz },
  )

  if (fim) return null
  return (
    <div ref={raiz} className="fixed inset-0 z-[80] bg-bg" role="status" aria-label="Carregando">
      <div data-conteudo-abertura className="grid h-full grid-rows-[auto_1fr_auto] px-4 py-6 md:px-8 md:py-8">
        <div className="flex items-start justify-between">
          <Marca />
          <span className="rotulo text-muted">Registro de encomendas</span>
        </div>
        <h2 data-palavra className="self-center text-[clamp(64px,22vw,240px)] leading-[0.9] font-semibold tracking-[-0.05em]">
          Portaria
        </h2>
        <div>
          <div className="mb-3 flex items-end justify-between">
            <span ref={numero} className="num text-5xl leading-none font-medium tracking-[-0.04em] md:text-7xl">
              000
            </span>
            <span className="rotulo text-muted">Carregando</span>
          </div>
          <div className="h-px bg-line">
            <div data-progresso className="h-full bg-accent" />
          </div>
        </div>
      </div>
      <div aria-hidden className="pointer-events-none absolute inset-0 flex">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} data-faixa className={`h-full flex-1 ${i % 2 ? 'bg-accent-strong' : 'bg-accent'}`} style={{ transform: 'scaleY(0)' }} />
        ))}
      </div>
    </div>
  )
}

/** Cabeçalho fixo: some ao rolar para baixo e volta ao rolar para cima. */
export function Cabecalho() {
  const ref = useRef<HTMLElement>(null)
  useGSAP(() => {
    const mostrar = gsap.quickTo(ref.current, 'yPercent', { duration: 0.4, ease: 'power3' })
    ScrollTrigger.create({
      start: 0,
      end: 'max',
      onUpdate: (s) => mostrar(s.direction === 1 && s.scroll() > 120 ? -130 : 0),
    })
  })
  return (
    <header ref={ref} className="fixed inset-x-0 top-0 z-50 px-3 pt-3 md:px-6">
      <nav
        aria-label="Principal"
        className="mx-auto flex max-w-[1240px] items-center justify-between gap-3 rounded-2xl border border-line bg-bg/80 py-2 pr-2 pl-4 backdrop-blur-md"
      >
        <a href="#topo" aria-label="Portaria, início">
          <Marca />
        </a>
        <div className="hidden items-center gap-1 md:flex">
          {[
            ['#problema', 'O problema'],
            ['#como-funciona', 'Como funciona'],
            ['#seguranca', 'Segurança'],
          ].map(([h, t]) => (
            <a key={h} href={h} className="rounded-full px-4 py-2.5 text-sm font-medium text-muted transition-colors hover:bg-s2 hover:text-ink">
              {t}
            </a>
          ))}
        </div>
        <BotaoDemo>
          <span className="sm:hidden">Demonstração</span>
          <span className="hidden sm:inline">Pedir demonstração</span>
        </BotaoDemo>
      </nav>
    </header>
  )
}

function Etiqueta({ texto, selo, className = '' }: { texto: string; selo?: string; className?: string }) {
  const s = selo ? porNome(selo) : undefined
  return (
    <div data-flutua className={`absolute flex items-center gap-2.5 rounded-2xl border border-line bg-s1/95 py-2 pr-4 pl-2 text-sm font-medium shadow-[0_18px_40px_-20px_rgb(21_21_43/.45)] backdrop-blur ${className}`}>
      {s ? <SeloMarca s={s} tamanho={30} /> : <span className="grid size-[30px] place-items-center rounded-lg bg-accent-soft text-accent">✓</span>}
      {texto}
    </div>
  )
}

export function Hero({ pronto }: { pronto: boolean }) {
  const raiz = useRef<HTMLElement>(null)

  useGSAP(
    () => {
      if (!pronto) return
      const mm = gsap.matchMedia()
      mm.add(CONDICOES.animar, () => {
        const titulo = SplitText.create('[data-hero-titulo]', { type: 'words', mask: 'words' })
        gsap
          .timeline({ defaults: { ease: 'expo.out' } })
          .from('[data-hero-rotulo]', { y: 16, opacity: 0, duration: 0.7 })
          .from(titulo.words, { yPercent: 110, duration: 1.1, stagger: 0.07 }, '<0.05')
          .from('[data-hero-sub]', { y: 24, opacity: 0, filter: 'blur(8px)', duration: 0.9 }, '-=0.7')
          .from('[data-hero-acoes] > *', { y: 20, opacity: 0, duration: 0.8, stagger: 0.08 }, '-=0.6')
          .from('[data-hero-celular]', { y: 160, rotate: 10, opacity: 0, duration: 1.4 }, 0.15)
          .from('[data-flutua]', { scale: 0.6, opacity: 0, duration: 0.9, stagger: 0.12, ease: 'back.out(1.8)' }, 0.8)

        // Paralaxe ao rolar: o celular sobe e endireita, as etiquetas se afastam.
        gsap
          .timeline({ scrollTrigger: { trigger: raiz.current, start: 'top top', end: 'bottom top', scrub: true } })
          .to('[data-hero-celular]', { yPercent: -18, rotate: 0, ease: 'none' }, 0)
          .to('[data-flutua]', { yPercent: (i) => -60 - i * 30, ease: 'none' }, 0)
          .to('[data-hero-texto]', { yPercent: -12, opacity: 0.2, ease: 'none' }, 0)
      })
    },
    { scope: raiz, dependencies: [pronto] },
  )

  return (
    <section ref={raiz} id="topo" className="relative overflow-hidden px-4 pt-28 pb-20 md:px-8 lg:min-h-[100svh] lg:pt-36">
      <div aria-hidden className="pointer-events-none absolute inset-0 [background-image:linear-gradient(var(--border)_1px,transparent_1px),linear-gradient(90deg,var(--border)_1px,transparent_1px)] [background-size:64px_64px] [mask-image:radial-gradient(ellipse_at_60%_40%,black,transparent_70%)]" />
      <div className="relative mx-auto grid max-w-[1240px] items-center gap-14 lg:grid-cols-12">
        <div data-hero-texto className="lg:col-span-7">
          <p data-hero-rotulo className="rotulo mb-6 text-accent">
            Registro de encomendas para condomínios
          </p>
          <h1 data-hero-titulo className="text-[clamp(44px,9.4vw,124px)] leading-[0.95] font-semibold tracking-[-0.045em]">
            A caderneta da portaria acabou.
          </h1>
          <p data-hero-sub className="mt-7 max-w-xl text-lg leading-relaxed text-muted md:text-xl">
            Fotografe a etiqueta, confira o morador e salve. O morador recebe um código, e a entrega na porta fica registrada com assinatura.
          </p>
          <div data-hero-acoes className="mt-9 flex flex-wrap items-center gap-3">
            <BotaoDemo grande />
            <a href="#problema" className="inline-flex min-h-16 items-center rounded-full px-6 text-lg font-medium text-ink underline-offset-4 hover:underline">
              Ver como funciona
            </a>
          </div>
        </div>
        <div className="relative mx-auto w-[260px] sm:w-[300px] lg:col-span-5 lg:w-[330px]">
          <div data-hero-celular style={{ rotate: '-4deg' }}>
            <Celular telas={[{ src: inicio, alt: 'Tela inicial do app Portaria com a lista de encomendas aguardando retirada' }]} />
          </div>
          <Etiqueta texto="Comprado em Mercado Livre" selo="Mercado Livre" className="top-[14%] -left-[38%] hidden sm:flex" />
          <Etiqueta texto="Entrega Correios" selo="Correios" className="top-[46%] -right-[6%] sm:-right-[30%]" />
          <Etiqueta texto="Código enviado ao morador" className="bottom-[12%] -left-[8%] sm:-left-[26%]" />
        </div>
      </div>
    </section>
  )
}
