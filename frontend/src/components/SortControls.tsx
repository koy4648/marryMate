import type { SortKey, SortState } from '../features/workspace/sorting'
const labels:Record<SortKey,string>={default:'기본순',amount:'금액',dueDate:'결제 예정일',payer:'결제자',visitDate:'예약·방문일',name:'이름'}
export function SortControls({name,value,onChange,keys=['default','amount','dueDate','payer','visitDate','name']}: {
  name:string; value:SortState; onChange:(value:SortState)=>void; keys?:SortKey[]
}) {
  return <div className="sort-controls"><label><span>정렬</span><select aria-label={`${name} 정렬 기준`} value={value.key} onChange={event=>onChange({...value,key:event.target.value as SortKey})}>{keys.map(key=><option key={key} value={key}>{labels[key]}</option>)}</select></label><button type="button" className="secondary" disabled={value.key==='default'} onClick={()=>onChange({...value,ascending:!value.ascending})} aria-label={`${name} ${value.ascending?'내림차순':'오름차순'}으로 변경`}>{value.ascending?'↑ 오름차순':'↓ 내림차순'}</button></div>
}
