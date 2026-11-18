import { useState } from 'react'
import { parseWon } from '../features/budget/budget'

/** Display comma grouping while submitting an integer number of won. */
export function MoneyInput({ name, defaultValue = 0, required = false, min = 0, onValueChange }: {
  name: string; defaultValue?: number; required?: boolean; min?: number; onValueChange?: (value: number) => void
}) {
  const [digits, setDigits] = useState(String(defaultValue || ''))
  return <><input type="hidden" name={name} value={digits || '0'}/><input
    type="text" inputMode="numeric" required={required}
    value={digits ? Number(digits).toLocaleString('ko-KR') : ''}
    placeholder="0" pattern={min > 0 ? '[1-9][0-9,]*' : '[0-9,]*'}
    title={min > 0 ? '1원 이상의 금액을 입력해 주세요.' : '원 단위로 입력해 주세요.'}
    onChange={event => {
      const next = event.target.value.replaceAll(',', '')
      if (/^\d{0,15}$/.test(next)) { setDigits(next.replace(/^0+(?=\d)/, '')); onValueChange?.(next ? parseWon(next) : 0) }
    }}/></>
}
