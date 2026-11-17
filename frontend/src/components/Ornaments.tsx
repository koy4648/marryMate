type OrnamentProps = { className?: string }

export function VineDivider({ className = '' }: OrnamentProps) {
  return <svg className={className} viewBox="0 0 420 48" fill="none" aria-hidden="true">
    <path d="M4 25c42-2 61 13 98 3 25-7 34-24 54-19 17 5 10 23 28 25 14 1 18-17 29-19 15-3 20 20 35 18 14-2 11-18 26-23 20-7 28 17 48 18 30 1 54-12 94-4"/>
    <path d="M77 30c-7-13-2-22 10-25M77 30c9-9 19-8 25 1M153 10c-4 11 1 20 11 24M269 13c5 10 1 18-8 25M326 28c9-12 20-15 32-7"/>
    <path d="M89 5c2 8-3 13-11 12M101 31c-7 3-13 1-15-6M154 9c7 1 11 6 10 13M271 12c-7 1-11 6-9 13M356 21c-2 8 2 13 10 14"/>
    <circle cx="210" cy="25" r="3"/>
  </svg>
}

export function WeddingCar({ className = '' }: OrnamentProps) {
  return <svg className={className} viewBox="0 0 260 160" fill="none" aria-hidden="true">
    <path d="M55 78c8-20 28-33 56-35h43c25 1 42 13 51 36l18 9c8 4 12 13 11 25H31c-1-14 4-23 14-27l10-8Z"/>
    <path d="M81 76c8-17 20-23 37-24h33c17 1 29 8 35 24H81Z"/>
    <path d="M130 52v24M45 88h178M66 113c0 14 10 24 24 24s24-10 24-24M168 113c0 14 10 24 24 24s24-10 24-24"/>
    <circle cx="90" cy="113" r="13"/><circle cx="192" cy="113" r="13"/>
    <path d="M131 62c-12-13-28 3-1 18 27-15 11-31 1-18ZM52 121c-20 3-34 12-42 25M60 126c-12 7-20 17-23 30M215 121c18 4 31 12 38 25M209 128c11 6 18 15 21 27"/>
    <path d="M22 142c8-5 14-4 19 2M42 149c8-6 15-5 21 1M199 148c8-6 15-5 21 1M222 141c8-5 14-4 19 2"/>
  </svg>
}

export function RibbonMark({ className = '' }: OrnamentProps) {
  return <svg className={className} viewBox="0 0 120 70" fill="none" aria-hidden="true">
    <path d="M60 30c-7-19-25-24-37-14-13 12 6 25 37 14Zm0 0c7-19 25-24 37-14 13 12-6 25-37 14ZM60 30c-8 12-11 23-10 35M60 30c8 12 11 23 10 35M51 45 36 62M69 45l15 17"/>
  </svg>
}

export function MonogramMark({ className = '' }: OrnamentProps) {
  return <svg className={className} viewBox="0 0 64 64" fill="none" aria-hidden="true">
    <ellipse cx="32" cy="32" rx="27" ry="28"/>
    <text x="31" y="41" textAnchor="middle" fontFamily="Cormorant Garamond, serif" fontSize="26" fontStyle="italic" letterSpacing="-5">MM</text>
    <path d="M13 49c7-4 13-3 19 2 6-5 13-6 20-2"/>
  </svg>
}

export function WordmarkLogo({ className = '' }: OrnamentProps) {
  return <svg className={className} viewBox="0 0 520 170" fill="none" aria-label="Marry Mate">
    <g className="wordmark-flower">
      <path d="M260 48c-21-18-22-37-2-43 18 10 20 28 2 43Zm0 0c21-18 40-16 43 4-13 16-31 14-43-4Zm0 0c-21-18-40-16-43 4 13 16 31 14 43-4Zm0 0c-9-24 0-41 19-37 12 17 4 32-19 37Zm0 0c9-24 0-41-19-37-12 17-4 32 19 37Z"/>
      <path d="M260 47v19M249 39c5 7 12 7 22 0M260 38l-3-15M260 38l4-15"/>
      <circle cx="260" cy="43" r="4"/>
      <path d="M215 48c-39-25-75-18-109 14M305 48c39-25 75-18 109 14M116 56c-7-18-2-31 14-41M144 40c1-15 10-25 27-28M404 56c7-18 2-31-14-41M376 40c-1-15-10-25-27-28"/>
      <path d="M130 15c-17-3-28 3-34 18 17 6 29 0 34-18ZM171 12c-13-9-25-8-36 3 12 12 25 11 36-3ZM390 15c17-3 28 3 34 18-17 6-29 0-34-18ZM349 12c13-9 25-8 36 3-12 12-25 11-36-3Z"/>
      <path d="M105 62c-22-4-35 5-38 24 23 2 35-6 38-24ZM415 62c22-4 35 5 38 24-23 2-35-6-38-24Z"/>
    </g>
    <text className="wordmark-text" x="260" y="126" textAnchor="middle">Marry Mate</text>
    <path className="wordmark-tail" d="M168 139c62 18 127 18 184 0M196 143c-22 14-45 13-63 2M324 143c22 14 45 13 63 2"/>
    <path className="wordmark-rule" d="M70 157h130M320 157h130"/>
    <text className="wordmark-tagline" x="260" y="163" textAnchor="middle">OUR WEDDING ARCHIVE</text>
  </svg>
}

export function FloralSwag({ className = '' }: OrnamentProps) {
  return <svg className={className} viewBox="0 0 360 110" fill="none" aria-hidden="true">
    <path d="M20 89c64 1 83-57 145-38 27 8 48 34 78 25 28-8 45-34 97-35"/>
    <path d="M67 78c-8-20-3-36 15-49M92 60c-2-17 7-30 25-38M260 71c3-17 15-28 34-33M289 57c7-15 19-23 36-23"/>
    <path d="M82 29c-17-5-30 1-37 16 18 7 31 1 37-16ZM117 22c-10-13-23-17-38-10 9 16 22 19 38 10ZM294 38c-16-5-29 0-37 14 17 8 30 3 37-14ZM325 34c-9-13-21-17-35-11 8 15 20 19 35 11Z"/>
    <path d="M177 56c-15-8-17-21-5-31 12-9 24-2 23 12 10-9 24-4 25 9 1 15-14 22-28 15-4 12-17 17-27 10-11-8-6-22 12-15Z"/>
    <circle cx="188" cy="52" r="4"/>
  </svg>
}

export function SilkRibbon({ className = '' }: OrnamentProps) {
  return <svg className={className} viewBox="0 0 360 80" fill="none" aria-hidden="true">
    <path d="M16 43c52-30 103-23 153 4 49 27 102 22 175-14"/>
    <path d="M169 47c-19-21-42-12-31 3 9 12 23 5 31-3Zm0 0c18-24 42-17 33-1-8 13-23 8-33 1ZM169 47c-7 9-11 18-12 28M169 47c9 8 15 17 18 27"/>
    <path d="M42 33c9-12 20-15 33-9M286 44c11 8 23 8 35 1"/>
  </svg>
}
