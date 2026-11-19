import { useState } from 'react'
import { parseWon } from '../features/budget/budget'

/** Display comma grouping while submitting an integer number of won. */
export function MoneyInput({ name, defaultValue = 0, required = false, min = 0, value, onValueChange, disabled = false, readOnly = false }: {
  name: string; disabled?: boolean; readOnly?: boolean; value?: number; defaultValue?: number; required?: boolean; min?: number; onValueChange?: (value: number) => void
}) {
  const [digits, setDigits] = useState(String(defaultValue || ''))
  const displayed = value===undefined ? digits : String(value||'')
  return <><input type="hidden" name={name} value={displayed || '0'}/><input
    type="text" inputMode="numeric" required={required} disabled={disabled} readOnly={readOnly}
    value={displayed ? Number(displayed).toLocaleString('ko-KR') : ''}
    placeholder="0" pattern={min > 0 ? '[1-9][0-9,]*' : '[0-9,]*'}
    title={min > 0 ? '1원 이상의 금액을 입력해 주세요.' : '원 단위로 입력해 주세요.'}
    onChange={event => {
      const next = event.target.value.replaceAll(',', '')
      if (/^\d{0,15}$/.test(next)) { setDigits(next.replace(/^0+(?=\d)/, '')); onValueChange?.(next ? parseWon(next) : 0) }
    }}/></>
}
