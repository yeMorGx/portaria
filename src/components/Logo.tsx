import { logoOficial, marcaPorNome, type Marca } from '../lib/marcas'

/**
 * Logo de loja ou transportadora. Usa `src/assets/logos/<id>.svg` quando existe;
 * senão, o ícone de domínio público ou um selo com a cor e a sigla da marca.
 */
export function LogoMarca({
  marca,
  nome,
  tamanho = 32,
}: {
  marca?: Marca | null
  nome?: string | null
  tamanho?: number
}) {
  const m = marca ?? marcaPorNome(nome)
  if (!m && !nome) return null
  const estilo = { width: tamanho, height: tamanho, fontSize: Math.round(tamanho * 0.4) }
  if (!m) {
    return (
      <span
        aria-hidden
        className="grid shrink-0 place-items-center rounded-campo bg-s3 font-semibold text-ink"
        style={estilo}
      >
        {nome!.trim().charAt(0).toUpperCase()}
      </span>
    )
  }
  return (
    <span
      aria-hidden
      className="relative grid shrink-0 place-items-center overflow-hidden rounded-campo font-bold tracking-[-0.02em]"
      style={{ ...estilo, background: m.cor, color: m.corTexto }}
    >
      {m.icone ? (
        <svg viewBox="0 0 24 24" width={tamanho * 0.58} height={tamanho * 0.58} fill="currentColor">
          <path d={m.icone} />
        </svg>
      ) : (
        m.sigla
      )}
      {logoOficial(m.id) && (
        <img src={logoOficial(m.id)} alt="" className="absolute inset-0 size-full bg-white object-contain p-1" />
      )}
    </span>
  )
}
