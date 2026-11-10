import { useRef } from 'react'
import { BotaoDemo, Marca, SeloMarca } from '../components/Basicos'
import { WHATSAPP_EXEMPLO } from '../config'
import { CONDICOES, gsap, ScrollTrigger, SplitText, useGSAP } from '../lib/gsap'
import { LOJAS, TRANSPORTADORAS } from '../lib/marcas'

function Fita({ itens, inverso }: { itens: typeof LOJAS; inverso?: boolean }) {
  const dobro = [...itens, ...itens]
  return (
    <div className="overflow-hidden [mask-image:linear-gradient(90deg,transparent,black_12%,black_88%,transparent)]">
      <div className="fita flex w-max gap-3" style={{ animationDirection: inverso ? 'reverse' : 'normal' }}>
        {dobro.map((s, i) => (
          <span key={i} aria-hidden={i >= itens.length} className="inline-flex items-center gap-2 rounded-full border border-line bg-s1 py-1.5 pr-4 pl-1.5 text-sm font-medium whitespace-nowrap">
            <SeloMarca s={s} tamanho={28} />
            {s.nome}
          </span>
        ))}
      </div>
    </div>
  )
}

/** Cena 5: bento que se monta (referência Dropbox Brand), com as funções reais do app. */
export function Bento() {
  const raiz = useRef<HTMLElement>(null)
  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      mm.add(CONDICOES.animar, () => {
        gsap.set('[data-bloco]', { opacity: 0 })
        ScrollTrigger.batch('[data-bloco]', {
          start: 'top 88%',
          once: true,
          onEnter: (lote) =>
            gsap.fromTo(
              lote,
              { opacity: 0, y: 90, scale: 0.9, rotate: () => gsap.utils.random(-5, 5) },
              { opacity: 1, y: 0, scale: 1, rotate: 0, duration: 1, ease: 'back.out(1.3)', stagger: 0.09 },
            ),
        })
        // Laser do mini visor e contador.
        gsap.fromTo('[data-mini-laser]', { top: '8%' }, { top: '88%', duration: 1.5, ease: 'sine.inOut', yoyo: true, repeat: -1 })
        const cont = { v: 0 }
        ScrollTrigger.create({
          trigger: '[data-contador]',
          start: 'top 85%',
          once: true,
          onEnter: () =>
            gsap.to(cont, {
              v: 3,
              duration: 1.4,
              ease: 'power3.out',
              onUpdate: () => {
                const el = raiz.current?.querySelector('[data-contador]')
                if (el) el.textContent = String(Math.round(cont.v))
              },
            }),
        })
      })
    },
    { scope: raiz },
  )

  return (
    <section ref={raiz} className="px-4 py-24 md:px-8 md:py-32">
      <div className="mx-auto max-w-[1240px]">
        <div className="mb-12 max-w-2xl">
          <p className="rotulo mb-5 text-accent">Bate o olho</p>
          <h2 className="text-[clamp(34px,5vw,64px)] leading-[0.98] font-semibold tracking-[-0.04em]">Tudo o que a portaria precisa ver, numa tela só.</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-6 lg:gap-5">
          <div data-bloco className="tile overflow-hidden p-6 md:col-span-6 lg:col-span-4">
            <p className="rotulo text-muted">Lê lojas e transportadoras</p>
            <p className="mt-2 mb-6 max-w-lg text-xl font-semibold tracking-[-0.02em]">A loja e a transportadora aparecem com selo, para saber de onde veio sem ler a etiqueta.</p>
            <div className="space-y-3">
              <Fita itens={LOJAS} />
              <Fita itens={TRANSPORTADORAS} inverso />
            </div>
            <p className="mt-5 text-xs text-muted">Selos ilustrativos. As marcas pertencem aos seus donos; o Portaria não tem parceria com elas.</p>
          </div>
          <div data-bloco className="tile flex flex-col justify-between p-6 md:col-span-3 lg:col-span-2">
            <p className="rotulo text-muted">Aguardando retirada</p>
            <p data-contador className="num my-4 text-[96px] leading-none font-medium tracking-[-0.05em]">3</p>
            <p className="text-muted">O que está na portaria agora, e há quanto tempo.</p>
          </div>
          <div data-bloco className="relative overflow-hidden rounded-[20px] bg-noite p-6 text-noite-texto md:col-span-3 lg:col-span-2">
            <p className="rotulo text-noite-texto-2">Câmera com visor</p>
            <div className="relative mx-auto my-5 aspect-[4/3] w-full max-w-[260px] rounded-xl bg-noite-3">
              {['top-2 left-2 border-t-2 border-l-2 rounded-tl-lg', 'top-2 right-2 border-t-2 border-r-2 rounded-tr-lg', 'bottom-2 left-2 border-b-2 border-l-2 rounded-bl-lg', 'right-2 bottom-2 border-r-2 border-b-2 rounded-br-lg'].map((c) => (
                <span key={c} className={`absolute size-6 border-white ${c}`} />
              ))}
              <span data-mini-laser className="absolute inset-x-4 h-[2px] rounded-full bg-[#a5a0ff] shadow-[0_0_14px_3px_rgb(139_132_245/.8)]" style={{ top: '45%' }} />
            </div>
            <p className="text-noite-texto-2">Foto da etiqueta ou código de barras e QR Code.</p>
          </div>
          <div data-bloco className="tile p-6 md:col-span-3 lg:col-span-2">
            <p className="rotulo text-muted">Lista por dia</p>
            <ul className="mt-4 divide-y divide-line">
              {[
                ['Maria Fernanda Oliveira', '202', '10:42'],
                ['João Carlos da Silva', '101', '09:15'],
                ['Beatriz Lima Costa', '505', '08:03'],
              ].map(([n, a, h]) => (
                <li key={n} className="flex items-center justify-between gap-3 py-3">
                  <span className="min-w-0">
                    <span className="block truncate font-medium">{n}</span>
                    <span className="text-sm text-muted">
                      Apto <span className="num text-ink">{a}</span>
                    </span>
                  </span>
                  <span className="num text-sm text-muted">{h}</span>
                </li>
              ))}
            </ul>
          </div>
          <div data-bloco className="tile overflow-hidden md:col-span-3 lg:col-span-2">
            <div className="grid h-full grid-cols-2">
              <div className="p-6">
                <p className="rotulo text-muted">Claro</p>
                <p className="mt-3 font-semibold">De dia na portaria</p>
              </div>
              <div className="bg-noite p-6 text-noite-texto">
                <p className="rotulo text-noite-texto-2">Escuro</p>
                <p className="mt-3 font-semibold">E no turno da noite</p>
              </div>
            </div>
          </div>
          <div data-bloco className="tile flex flex-col justify-between gap-4 p-6 text-on-accent md:col-span-6 md:flex-row md:items-end md:p-8" style={{ background: 'var(--accent)' }}>
            <p className="rotulo text-on-accent/80">Celular e computador</p>
            <p className="max-w-2xl text-xl font-semibold tracking-[-0.02em] md:text-3xl">Funciona no computador da portaria e no celular de quem leva o pacote até a porta.</p>
          </div>
        </div>
      </div>
    </section>
  )
}

const ANO = new Date().getFullYear()

const FATOS = [
  'O código é conferido no servidor, nunca no navegador.',
  'Cinco tentativas erradas bloqueiam o código por 15 minutos.',
  'Fotos e assinaturas ficam em armazenamento privado, só para quem está logado.',
  'O morador só recebe aviso se aceitou receber mensagens.',
]

/** Cena 6 (escura): código de retirada em palhetas e fatos de segurança que acendem. */
export function Seguranca() {
  const raiz = useRef<HTMLElement>(null)
  const CODIGO = '482913'
  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      mm.add(CONDICOES.animar, () => {
        const digitos = gsap.utils.toArray<HTMLElement>('[data-digito]', raiz.current)
        ScrollTrigger.create({
          trigger: '[data-palhetas]',
          start: 'top 80%',
          onEnter: () => {
            digitos.forEach((el, i) => {
              const voltas = { n: 0 }
              const alvo = 14 + i * 5
              gsap.to(voltas, {
                n: alvo,
                duration: 1.2 + i * 0.18,
                ease: 'power2.out',
                onUpdate: () => {
                  const n = Math.floor(voltas.n)
                  if (el.dataset.n !== String(n)) {
                    el.dataset.n = String(n)
                    el.textContent = n >= alvo ? CODIGO[i] : String((n * 7 + i) % 10)
                    gsap.fromTo(el, { rotateX: -70 }, { rotateX: 0, duration: 0.12, ease: 'power1.out' })
                  }
                },
                onComplete: () => void (el.textContent = CODIGO[i]),
              })
            })
          },
        })
        gsap.fromTo(
          '[data-fato]',
          { opacity: 0.18 },
          { opacity: 1, stagger: 0.5, ease: 'none', scrollTrigger: { trigger: '[data-fatos]', start: 'top 80%', end: 'bottom 55%', scrub: true } },
        )
      })
    },
    { scope: raiz },
  )

  return (
    <section ref={raiz} id="seguranca" className="bg-noite px-4 py-24 text-noite-texto md:px-8 md:py-36">
      <div className="mx-auto grid max-w-[1240px] gap-16 lg:grid-cols-2 lg:items-center">
        <div>
          <p className="rotulo mb-5 text-acento-noite">Segurança</p>
          <h2 className="text-[clamp(36px,6vw,76px)] leading-[0.98] font-semibold tracking-[-0.04em]">Só o morador retira.</h2>
          <p className="mt-6 max-w-lg text-lg text-noite-texto-2">Cada encomenda tem um código de 6 dígitos que vai para o morador. Sem o código, a entrega só sai com justificativa registrada.</p>
          <div data-palhetas className="mt-10 flex gap-2 [perspective:600px] md:gap-3" aria-label={`Exemplo de código de retirada: ${CODIGO.split('').join(' ')}`}>
            {CODIGO.split('').map((d, i) => (
              <span key={i} data-digito aria-hidden className="num grid h-20 w-12 place-items-center rounded-xl border border-white/10 bg-noite-3 text-4xl font-medium md:h-28 md:w-[4.5rem] md:text-6xl">
                {d}
              </span>
            ))}
          </div>
        </div>
        <ul data-fatos className="space-y-6">
          {FATOS.map((f, i) => (
            <li key={f} data-fato className="grid grid-cols-[2.5rem_1fr] gap-3 border-t border-white/10 pt-6 text-[clamp(20px,2.4vw,28px)] leading-snug font-medium tracking-[-0.015em]">
              <span className="num pt-1 text-sm text-acento-noite">0{i + 1}</span>
              {f}
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

/** Cena 7: chamada final e rodapé. */
export function Chamada() {
  const raiz = useRef<HTMLElement>(null)
  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      mm.add(CONDICOES.animar, () => {
        const t = SplitText.create('[data-chamada]', { type: 'words,chars', mask: 'chars' })
        gsap.from(t.chars, {
          yPercent: 115,
          rotate: 5,
          duration: 1,
          ease: 'expo.out',
          stagger: 0.025,
          scrollTrigger: { trigger: '[data-chamada]', start: 'top 80%' },
        })
        gsap.from('[data-chamada-acao] > *', { y: 30, opacity: 0, duration: 0.9, ease: 'expo.out', stagger: 0.1, scrollTrigger: { trigger: '[data-chamada-acao]', start: 'top 90%' } })
      })
    },
    { scope: raiz },
  )
  return (
    <>
      <section ref={raiz} className="px-4 py-28 md:px-8 md:py-40">
        <div className="mx-auto max-w-[1240px]">
          <h2 data-chamada className="text-[clamp(48px,11vw,168px)] leading-[0.9] font-semibold tracking-[-0.05em]">
            Peça uma demonstração.
          </h2>
          <div data-chamada-acao className="mt-12 flex flex-wrap items-center gap-6">
            <BotaoDemo grande />
            <p className="max-w-sm text-muted">Mostramos o app funcionando com os dados do seu condomínio. A conversa é pelo WhatsApp.</p>
          </div>
        </div>
      </section>
      <footer className="border-t border-line px-4 py-10 md:px-8">
        <div className="mx-auto flex max-w-[1240px] flex-col gap-6 text-sm text-muted md:flex-row md:items-center md:justify-between">
          <Marca />
          <p className="max-w-xl">Marcas citadas pertencem aos seus donos. O Portaria não tem parceria com lojas ou transportadoras.</p>
          <p>© {ANO} Portaria</p>
        </div>
        {WHATSAPP_EXEMPLO && import.meta.env.DEV && (
          <p className="mx-auto mt-6 max-w-[1240px] rounded-lg bg-[#fff3cd] px-4 py-2 text-sm text-[#7a5b00]">
            Aviso de desenvolvimento: o número do WhatsApp em src/config.ts ainda é de exemplo.
          </p>
        )}
      </footer>
    </>
  )
}
