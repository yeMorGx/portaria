import { useRef, type ReactNode } from 'react'
import entrega from '../assets/telas/entrega.jpg'
import lendo from '../assets/telas/lendo.jpg'
import retiradas from '../assets/telas/retiradas.jpg'
import { Celular } from '../components/Basicos'
import { CONDICOES, gsap, useGSAP } from '../lib/gsap'

const CODIGO = '482913'

const PASSOS = [
  { n: '1', titulo: 'Recebe', texto: 'Na portaria, uma foto da etiqueta e o pedido está registrado.' },
  { n: '2', titulo: 'Avisa', texto: 'O morador recebe uma mensagem com um código de retirada.' },
  { n: '3', titulo: 'Entrega', texto: 'Na porta, o morador informa o código e assina na tela.' },
  { n: '4', titulo: 'Registra', texto: 'Fica guardado quem recebeu, quem entregou e quando.' },
]

/** Tela de mensagem genérica (não é o app de nenhuma empresa): o aviso com o código, no texto real do produto. */
function TelaMensagem() {
  return (
    <div className="absolute inset-0 flex flex-col bg-[#efeae2] pt-12">
      <div className="flex items-center gap-3 border-b border-black/10 bg-white px-4 py-3">
        <span className="grid size-9 place-items-center rounded-full bg-accent text-sm font-semibold text-white">P</span>
        <div>
          <p className="text-sm font-semibold">Portaria do condomínio</p>
          <p className="text-xs text-muted">mensagem automática</p>
        </div>
      </div>
      <div className="flex-1 space-y-3 p-4">
        <div className="max-w-[88%] rounded-2xl rounded-tl-md bg-white p-3 text-[13px] leading-snug shadow-sm">
          Olá, Maria! Chegou uma encomenda para você na portaria (Mercado Livre · Correios). Código de retirada:{' '}
          <strong className="num tracking-wider">{CODIGO}</strong>. Informe o código ao funcionário na entrega.
          <span className="mt-1 block text-right text-[10px] text-muted">10:42</span>
        </div>
      </div>
    </div>
  )
}

function TelasPasso({ indice }: { indice?: number }) {
  // indice definido: só aquela tela (versão do celular); sem indice: as 4 empilhadas (palco do computador).
  const telas: Array<ReactNode> = [
    <img key="0" src={lendo} alt="App lendo a etiqueta da encomenda" className="absolute inset-0 size-full object-cover object-top" loading="lazy" />,
    <TelaMensagem key="1" />,
    <img key="2" src={entrega} alt="Tela de entrega com código de retirada e assinatura do morador" className="absolute inset-0 size-full object-cover object-top" loading="lazy" />,
    <img key="3" src={retiradas} alt="Lista de encomendas retiradas, com horário" className="absolute inset-0 size-full object-cover object-top" loading="lazy" />,
  ]
  if (indice !== undefined) return <>{telas[indice]}</>
  return (
    <>
      {telas.map((t, i) => (
        <div key={i} data-palco={i} className="absolute inset-0" style={{ opacity: i === 0 ? 1 : 0 }}>
          {t}
        </div>
      ))}
    </>
  )
}

/** Condomínio em corte: portaria no térreo, elevador e o apartamento 202. Desenho próprio, em blocos. */
function Predio() {
  return (
    <svg viewBox="0 0 640 520" className="h-auto w-full" role="img" aria-label="Corte do condomínio: a encomenda sai da portaria, sobe pelo elevador e chega à porta do apartamento 202">
      <defs>
        <pattern id="janela" width="46" height="100" patternUnits="userSpaceOnUse">
          <rect x="12" y="28" width="22" height="34" rx="3" fill="var(--surface-2)" stroke="var(--border)" />
        </pattern>
      </defs>
      {/* chão e rua */}
      <line x1="0" y1="470" x2="640" y2="470" stroke="var(--text)" strokeWidth="1.5" />
      <line x1="0" y1="488" x2="640" y2="488" stroke="var(--border)" strokeDasharray="10 10" />
      {/* teto e lateral (profundidade) */}
      <polygon points="140,60 184,30 604,30 560,60" fill="var(--surface-2)" stroke="var(--text)" strokeWidth="1.5" />
      <polygon points="560,60 604,30 604,440 560,470" fill="var(--surface-3)" stroke="var(--text)" strokeWidth="1.5" />
      {/* corpo */}
      <rect x="140" y="60" width="420" height="410" fill="var(--surface-1)" stroke="var(--text)" strokeWidth="1.5" />
      {[160, 260, 360].map((y) => (
        <line key={y} x1="140" y1={y} x2="560" y2={y} stroke="var(--text)" strokeWidth="1" />
      ))}
      <rect x="140" y="60" width="180" height="300" fill="url(#janela)" />
      <rect x="380" y="60" width="180" height="100" fill="url(#janela)" />
      <rect x="380" y="260" width="180" height="100" fill="url(#janela)" />
      {/* elevador */}
      <rect x="320" y="60" width="60" height="410" fill="var(--surface-2)" stroke="var(--text)" strokeWidth="1" />
      <line x1="350" y1="60" x2="350" y2="470" stroke="var(--border)" />
      <rect data-cabine x="328" y="402" width="44" height="60" rx="3" fill="var(--surface-1)" stroke="var(--text)" />
      {/* portaria */}
      <rect x="166" y="420" width="120" height="22" rx="4" fill="var(--accent-soft)" stroke="var(--text)" />
      <rect x="146" y="380" width="14" height="90" fill="var(--surface-3)" stroke="var(--text)" />
      <text x="226" y="404" textAnchor="middle" className="rotulo" fill="var(--text-2)" fontSize="11">
        PORTARIA
      </text>
      {/* apto 202 */}
      <rect x="400" y="166" width="140" height="94" fill="var(--accent-soft)" opacity="0.5" />
      <rect data-porta x="494" y="190" width="38" height="70" rx="3" fill="var(--surface-1)" stroke="var(--text)" strokeWidth="1.5" />
      <circle cx="524" cy="228" r="2.5" fill="var(--text)" />
      <text x="452" y="186" textAnchor="middle" className="rotulo" fill="var(--text-2)" fontSize="11">
        APTO 202
      </text>
      {/* aviso: mensagem que sobe da portaria até o apartamento */}
      <path id="caminho-aviso" d="M226 418 C 226 300, 420 300, 452 200" fill="none" stroke="var(--accent)" strokeWidth="1.5" strokeDasharray="4 6" data-aviso />
      {/* caminho da encomenda */}
      <path id="caminho-pacote" d="M30 455 L 226 455 L 350 455 L 350 225 L 513 225" fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" data-trilha />
      <circle data-envelope r="7" fill="var(--accent)" stroke="white" strokeWidth="2" cx="226" cy="418" opacity="0" />
      <g data-pacote>
        <rect x="-12" y="-12" width="24" height="24" rx="5" fill="#c8a26b" stroke="var(--text)" strokeWidth="1.5" />
        <line x1="-12" y1="-3" x2="12" y2="-3" stroke="var(--text)" strokeWidth="1" />
      </g>
      <g data-visto opacity="0">
        <circle cx="513" cy="160" r="16" fill="var(--ok)" />
        <path d="M505 160 l6 6 l10 -12" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      </g>
    </svg>
  )
}

/** Cena 4: a encomenda percorre o condomínio; em cada parada o celular mostra a tela correspondente. */
export function Caminho() {
  const raiz = useRef<HTMLElement>(null)
  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      mm.add({ animar: CONDICOES.animar, grande: CONDICOES.grande }, (ctx) => {
        const { animar, grande } = ctx.conditions as { animar: boolean; grande: boolean }
        if (!animar) {
          gsap.set('[data-pacote]', { x: 513, y: 225 })
          gsap.set('[data-visto]', { opacity: 1 })
          return
        }
        const tl = gsap.timeline({
          defaults: { ease: 'none' },
          scrollTrigger: grande
            ? { trigger: raiz.current, start: 'top top', end: '+=320%', scrub: 0.8, pin: true }
            : { trigger: '[data-predio]', start: 'top 70%', end: 'bottom 20%', scrub: 0.8 },
        })
        const passo = (i: number, t: number) => {
          if (grande) {
            tl.to('[data-passo]', { opacity: 0.3, duration: 0.05 }, t)
            tl.to(`[data-passo="${i}"]`, { opacity: 1, duration: 0.05 }, t)
            tl.to('[data-palco]', { opacity: 0, duration: 0.12 }, t)
            tl.to(`[data-palco="${i}"]`, { opacity: 1, duration: 0.12 }, t)
          }
        }
        if (grande) gsap.set('[data-passo]', { opacity: 0.3 })
        tl.from('[data-trilha]', { drawSVG: '0%', duration: 1 }, 0)
        tl.set('[data-pacote]', { x: 30, y: 455 }, 0)
        passo(0, 0)
        tl.to('[data-pacote]', { motionPath: { path: 'M30 455 L 226 455' }, duration: 0.6 }, 0)
        passo(1, 0.75)
        tl.to('[data-envelope]', { opacity: 1, duration: 0.05 }, 0.75)
        tl.to('[data-envelope]', { motionPath: { path: '#caminho-aviso', align: '#caminho-aviso', alignOrigin: [0.5, 0.5] }, duration: 0.6 }, 0.8)
        tl.to('[data-envelope]', { scale: 2.2, opacity: 0, duration: 0.15, transformOrigin: '50% 50%' }, 1.4)
        passo(2, 1.6)
        tl.to('[data-pacote]', { motionPath: { path: 'M226 455 L 350 455 L 350 225 L 513 225' }, duration: 1.2 }, 1.6)
        tl.to('[data-cabine]', { y: -236, duration: 0.6 }, 1.95)
        passo(3, 2.9)
        tl.to('[data-porta]', { fill: 'var(--accent-soft)', duration: 0.1 }, 2.9)
        tl.fromTo('[data-visto]', { opacity: 0, scale: 0.4, transformOrigin: '513px 160px' }, { opacity: 1, scale: 1, duration: 0.3, ease: 'back.out(2)' }, 2.95)
        tl.to({}, { duration: 0.4 })
      })
    },
    { scope: raiz },
  )

  return (
    <section ref={raiz} className="relative overflow-hidden px-4 py-24 md:px-8 lg:flex lg:h-[100svh] lg:items-center lg:py-0">
      <div className="mx-auto grid w-full max-w-[1240px] items-center gap-10 lg:grid-cols-12 lg:gap-8">
        <div className="lg:col-span-4">
          <p className="rotulo mb-5 text-accent">O caminho da encomenda</p>
          <h2 className="text-[clamp(34px,5vw,60px)] leading-[0.98] font-semibold tracking-[-0.04em]">Da portaria até a porta, sem perder o fio.</h2>
          <ol className="mt-10 space-y-6">
            {PASSOS.map((p, i) => (
              <li key={p.n} data-passo={i} className="grid grid-cols-[2.5rem_1fr] gap-x-3">
                <span className="num text-sm text-accent">0{p.n}</span>
                <div>
                  <p className="text-xl font-semibold tracking-[-0.02em]">{p.titulo}</p>
                  <p className="mt-1 text-muted">{p.texto}</p>
                  <div className="mt-4 w-[160px] lg:hidden">
                    <Celular>
                      <TelasPasso indice={i} />
                    </Celular>
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </div>
        <div data-predio className="order-first lg:order-none lg:col-span-5">
          <Predio />
        </div>
        <div className="hidden lg:col-span-3 lg:block">
          <div className="mx-auto w-[240px]">
            <Celular>
              <TelasPasso />
            </Celular>
          </div>
        </div>
      </div>
    </section>
  )
}
