import { BrowserMultiFormatReader } from '@zxing/browser'
import { Camera as IconeCamera, Upload } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Aviso, Botao } from './ui'
import { Visor, type VisorApi } from './Visor'

async function abrirCamera(video: HTMLVideoElement): Promise<MediaStream> {
  const stream = await navigator.mediaDevices.getUserMedia({
    video: { facingMode: 'environment', width: { ideal: 1920 } },
    audio: false,
  })
  video.srcObject = stream
  await video.play()
  return stream
}

/** Câmera para fotografar a etiqueta. Também aceita enviar um arquivo de imagem. */
export function CapturaFoto({ aoCapturar }: { aoCapturar: (foto: Blob) => void }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const visor = useRef<VisorApi>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [pronta, setPronta] = useState(false)

  useEffect(() => {
    let stream: MediaStream | null = null
    let cancelado = false
    const video = videoRef.current!
    abrirCamera(video)
      .then((s) => {
        if (cancelado) s.getTracks().forEach((t) => t.stop())
        else {
          stream = s
          setPronta(true)
        }
      })
      .catch(() => setErro('Não foi possível abrir a câmera. Permita o acesso ou envie uma foto do computador.'))
    return () => {
      cancelado = true
      stream?.getTracks().forEach((t) => t.stop())
    }
  }, [])

  async function fotografar() {
    const v = videoRef.current!
    // Congela o quadro antes do flash, para a foto ser a imagem do instante do toque.
    const c = document.createElement('canvas')
    c.width = v.videoWidth
    c.height = v.videoHeight
    c.getContext('2d')!.drawImage(v, 0, 0)
    await visor.current?.flash()
    c.toBlob((b) => b && aoCapturar(b), 'image/jpeg', 0.9)
  }

  return (
    <div className="space-y-4">
      {erro && <Aviso>{erro}</Aviso>}
      <Visor ref={visor} modo="foto" dica="Enquadre a etiqueta dentro da moldura">
        <video
          ref={videoRef}
          muted
          playsInline
          className="absolute inset-0 size-full object-cover"
          data-testid="video-foto"
        />
      </Visor>
      <div className="flex flex-col gap-3 md:flex-row">
        <Botao grande onClick={fotografar} disabled={!pronta} className="md:flex-1">
          <IconeCamera className="size-6" strokeWidth={1.75} />
          Fotografar etiqueta
        </Botao>
        <label className="inline-flex min-h-16 cursor-pointer items-center justify-center gap-3 rounded-botao border border-line bg-s1 px-6 text-lg font-semibold transition duration-[120ms] hover:bg-s2 focus-within:outline focus-within:outline-[3px] focus-within:outline-offset-2 focus-within:outline-accent md:px-8">
          <Upload className="size-6" strokeWidth={1.75} />
          Enviar arquivo
          <input
            type="file"
            accept="image/*"
            className="sr-only"
            data-testid="arquivo-foto"
            onChange={(e) => e.target.files?.[0] && aoCapturar(e.target.files[0])}
          />
        </label>
      </div>
    </div>
  )
}

/** Leitor de código de barras e QR Code usando a câmera. */
export function LeitorCodigo({ aoLer }: { aoLer: (texto: string) => void }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const visor = useRef<VisorApi>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [manual, setManual] = useState('')

  useEffect(() => {
    const leitor = new BrowserMultiFormatReader()
    let controles: { stop: () => void } | null = null
    let cancelado = false
    leitor
      .decodeFromVideoDevice(undefined, videoRef.current!, (resultado, _erro, c) => {
        if (resultado && !cancelado) {
          cancelado = true
          c.stop()
          const texto = resultado.getText()
          // Trava no alvo antes de seguir para a conferência.
          void (visor.current?.travar() ?? Promise.resolve()).then(() => aoLer(texto))
        }
      })
      .then((c) => {
        if (cancelado) c.stop()
        else controles = c
      })
      .catch(() => setErro('Não foi possível abrir a câmera. Permita o acesso ou digite o código abaixo.'))
    return () => {
      cancelado = true
      controles?.stop()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="space-y-4">
      {erro && <Aviso>{erro}</Aviso>}
      <Visor ref={visor} modo="codigo" dica="Procurando código de barras ou QR Code…">
        <video ref={videoRef} muted playsInline className="absolute inset-0 size-full object-cover" />
      </Visor>
      <p className="m-0 text-muted">Aponte o código de barras ou QR Code da etiqueta para a câmera.</p>
      <form
        className="flex flex-col gap-3 md:flex-row"
        onSubmit={(e) => {
          e.preventDefault()
          if (manual.trim()) aoLer(manual.trim())
        }}
      >
        <input
          value={manual}
          onChange={(e) => setManual(e.target.value)}
          placeholder="Ou digite o código"
          aria-label="Código digitado"
          className="min-h-12 flex-1 rounded-botao border border-line bg-s1 px-4 text-base"
        />
        <Botao variante="secundario" type="submit">
          Usar código
        </Botao>
      </form>
    </div>
  )
}
