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
