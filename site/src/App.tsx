import Lenis from 'lenis'
import { useEffect, useState } from 'react'
import { Caminho } from './cenas/Caminho'
import { Bento, Chamada, Seguranca } from './cenas/Final'
import { Problema, RealDado } from './cenas/Historia'
import { Abertura, Cabecalho, Hero, precisaAbertura } from './cenas/Topo'
import { CONDICOES, gsap, ScrollTrigger } from './lib/gsap'

export default function App() {
  const [abertura] = useState(precisaAbertura)
  const [pronto, setPronto] = useState(!abertura)

  // Rolagem suave (Lenis) sincronizada com o ScrollTrigger. Desligada com movimento reduzido.
  useEffect(() => {
    if (window.matchMedia(CONDICOES.reduzir).matches) return
    const lenis = new Lenis({ anchors: { offset: -80 } })
    lenis.on('scroll', ScrollTrigger.update)
    const quadro = (t: number) => lenis.raf(t * 1000)
    gsap.ticker.add(quadro)
    gsap.ticker.lagSmoothing(0)
    return () => {
      gsap.ticker.remove(quadro)
      lenis.destroy()
    }
  }, [])

  // Depois que as fontes carregam, as medidas das cenas presas mudam: recalcula.
  useEffect(() => {
    document.fonts?.ready.then(() => ScrollTrigger.refresh())
  }, [])

  return (
    <>
      {abertura && <Abertura aoFim={() => setPronto(true)} />}
      <Cabecalho />
      <main>
        <Hero pronto={pronto} />
        <Problema />
        <RealDado />
        <Caminho />
        <Bento />
        <Seguranca />
        <Chamada />
      </main>
    </>
  )
}
