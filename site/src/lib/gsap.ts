import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin'
import { MotionPathPlugin } from 'gsap/MotionPathPlugin'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SplitText } from 'gsap/SplitText'

gsap.registerPlugin(useGSAP, ScrollTrigger, SplitText, DrawSVGPlugin, MotionPathPlugin)

/** Condições usadas em todas as cenas: movimento completo e tamanho de tela. */
export const CONDICOES = {
  animar: '(prefers-reduced-motion: no-preference)',
  reduzir: '(prefers-reduced-motion: reduce)',
  grande: '(min-width: 1024px)',
  pequeno: '(max-width: 1023px)',
}

export { gsap, ScrollTrigger, SplitText, useGSAP }
