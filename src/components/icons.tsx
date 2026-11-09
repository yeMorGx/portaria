import type { ReactNode, SVGProps } from 'react'

function Icone({ children, ...props }: SVGProps<SVGSVGElement> & { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="1em"
      height="1em"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      {...props}
    >
      {children}
    </svg>
  )
}

type P = SVGProps<SVGSVGElement>

export const IconeCamera = (p: P) => (
  <Icone {...p}>
    <path d="M4 8.5A1.5 1.5 0 0 1 5.5 7H8l1.2-2h5.6L16 7h2.5A1.5 1.5 0 0 1 20 8.5v9a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 17.5z" />
    <circle cx="12" cy="13" r="3.5" />
  </Icone>
)

export const IconeCodigo = (p: P) => (
  <Icone {...p}>
    <path d="M4 8V5.5A1.5 1.5 0 0 1 5.5 4H8M16 4h2.5A1.5 1.5 0 0 1 20 5.5V8M20 16v2.5a1.5 1.5 0 0 1-1.5 1.5H16M8 20H5.5A1.5 1.5 0 0 1 4 18.5V16" />
    <path d="M8 9v6M11 9v6M14 9v6M17 9v6" />
  </Icone>
)

export const IconeSeta = (p: P) => (
  <Icone {...p}>
    <path d="M19 12H5M11 6l-6 6 6 6" />
  </Icone>
)

export const IconeMais = (p: P) => (
  <Icone {...p}>
    <path d="M12 5v14M5 12h14" />
  </Icone>
)

export const IconeSair = (p: P) => (
  <Icone {...p}>
    <path d="M10 5H6.5A1.5 1.5 0 0 0 5 6.5v11A1.5 1.5 0 0 0 6.5 19H10M15 8l4 4-4 4M19 12H9.5" />
  </Icone>
)

export const IconePacote = (p: P) => (
  <Icone {...p}>
    <path d="M12 3 4 7.2v9.6L12 21l8-4.2V7.2zM4 7.2l8 4.3 8-4.3M12 11.5V21M8 5.1l8 4.3" />
  </Icone>
)

export const IconeEnviar = (p: P) => (
  <Icone {...p}>
    <path d="M12 16V5M7.5 9.5 12 5l4.5 4.5M5 15v2.5A1.5 1.5 0 0 0 6.5 19h11a1.5 1.5 0 0 0 1.5-1.5V15" />
  </Icone>
)
