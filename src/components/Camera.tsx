import { useEffect, useRef, useState } from 'react'
import { BrowserMultiFormatReader } from '@zxing/browser'
import { Botao, Aviso } from './ui'

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

  function fotografar() {
    const v = videoRef.current!
    const c = document.createElement('canvas')
    c.width = v.videoWidth
    c.height = v.videoHeight
    c.getContext('2d')!.drawImage(v, 0, 0)
    c.toBlob((b) => b && aoCapturar(b), 'image/jpeg', 0.9)
  }

  return (
    <div className="space-y-4">
      {erro && <Aviso>{erro}</Aviso>}
      <video
        ref={videoRef}
        muted
        playsInline
        className="aspect-video w-full rounded-2xl bg-black object-cover"
        data-testid="video-foto"
      />
      <div className="flex flex-wrap gap-3">
        <Botao grande onClick={fotografar} disabled={!pronta}>
          Fotografar etiqueta
        </Botao>
        <label className="inline-flex min-h-16 cursor-pointer items-center rounded-xl border border-line bg-card px-8 text-xl font-semibold hover:border-brand">
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
          aoLer(resultado.getText())
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
      <video ref={videoRef} muted playsInline className="aspect-video w-full rounded-2xl bg-black object-cover" />
      <p className="text-muted">Aponte o código de barras ou QR Code da etiqueta para a câmera.</p>
      <form
        className="flex gap-3"
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
          className="min-h-12 flex-1 rounded-xl border border-line bg-card px-4"
        />
        <Botao variante="secundario" type="submit">
          Usar código
        </Botao>
      </form>
    </div>
  )
}
