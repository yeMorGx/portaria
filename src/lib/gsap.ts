import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin'
import { SplitText } from 'gsap/SplitText'

gsap.registerPlugin(useGSAP, SplitText, DrawSVGPlugin)

export { gsap, SplitText, useGSAP }
