/** Reconhece o texto de uma imagem usando Tesseract.js (roda no navegador, carregado sob demanda). */
export async function lerTexto(imagem: Blob): Promise<string> {
  const { createWorker } = await import('tesseract.js')
  const worker = await createWorker('por')
  try {
    const { data } = await worker.recognize(imagem)
    return data.text
  } finally {
    await worker.terminate()
  }
}

/** Reduz a foto para ~1600px e JPEG, para OCR mais rápido e armazenamento menor. */
export async function reduzirImagem(origem: Blob, maxLado = 1600): Promise<Blob> {
  const bmp = await createImageBitmap(origem)
  const escala = Math.min(1, maxLado / Math.max(bmp.width, bmp.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bmp.width * escala)
  canvas.height = Math.round(bmp.height * escala)
  canvas.getContext('2d')!.drawImage(bmp, 0, 0, canvas.width, canvas.height)
  bmp.close()
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Falha ao processar imagem'))), 'image/jpeg', 0.85),
  )
}
