import { useId } from 'react'

export function IncludeExclude({ label, included, onChange, description, disabled = false, name }: {
  label: string; included: boolean; onChange: (included: boolean) => void; description: string; disabled?: boolean; name?: string
}) {
  const group = useId()
  return <fieldset className="include-exclude" disabled={disabled}>
    <legend>{label}</legend>
    {name && included && <input type="hidden" name={name} value="included"/>}
    <div className="inclusion-choices">
      <label className="inclusion-choice"><input type="radio" name={group} value="included" checked={included} onChange={() => onChange(true)}/><span>포함</span></label>
      <label className="inclusion-choice"><input type="radio" name={group} value="excluded" checked={!included} onChange={() => onChange(false)}/><span>제외</span></label>
    </div>
    <small>{description}</small>
  </fieldset>
}
