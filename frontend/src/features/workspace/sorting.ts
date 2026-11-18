import type { Payment } from '../budget/budget'
import type { PlanningItem } from '../planning/planning'
import type { VenueReview } from '../../lib/api'
import { itemExtra, itemQuote, packageFor } from '../budget/estimates'

export type SortKey = 'default' | 'amount' | 'dueDate' | 'payer' | 'visitDate' | 'name'
export type SortState = { key: SortKey; ascending: boolean }
export const defaultSort: SortState = { key: 'default', ascending: true }
export type SortValues = Partial<Record<Exclude<SortKey, 'default'>, string | number | null>>

export function sortRows<T>(rows: T[], state: SortState, values: (row: T) => SortValues) {
  if (state.key === 'default') return [...rows]
  const key = state.key
  return rows.map((row,index)=>({row,index,value:values(row)[key]})).sort((a,b)=>{
    const missingA=a.value==null||a.value===''; const missingB=b.value==null||b.value===''
    if(missingA||missingB) return missingA===missingB?a.index-b.index:missingA?1:-1
    const order=typeof a.value==='number'&&typeof b.value==='number'?a.value-b.value:String(a.value).localeCompare(String(b.value),'ko',{numeric:true})
    return (state.ascending?order:-order)||a.index-b.index
  }).map(entry=>entry.row)
}

export function paymentOrderValues(payments: Payment[]) {
  const active=payments.filter(payment=>!['CANCELLED','REFUNDED'].includes(payment.status))
  return {
    dueDate: active.filter(payment=>payment.status!=='PAID').map(payment=>payment.dueDate).sort()[0]??null,
    payer: [...new Set(active.map(payment=>payment.payer).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'ko')).join(', ')||null,
  }
}

export function planningOrderValues(item:PlanningItem, all:PlanningItem[], reviews:VenueReview[], payments:Payment[]) {
  const parent=packageFor(item,all)
  const children=item.packageContract?all.filter(child=>child.packageParentId===item.id).map(child=>child.id):[]
  const related=payments.filter(payment=>payment.planningItemId===(parent?.id??item.id)||(payment.type==='EXTRA'&&(payment.planningItemId===item.id||children.includes(Number(payment.planningItemId)))))
  return {name:item.vendorName||item.itemName,amount:parent?itemExtra(item):itemQuote(item,reviews,all),visitDate:item.scheduleDate?`${item.scheduleDate}T${item.scheduleTime?.slice(0,5)??'99:99'}`:null,...paymentOrderValues(related)}
}

export function sortPlanningItems(items: PlanningItem[], state: SortState, all: PlanningItem[], reviews: VenueReview[], payments: Payment[]) {
  return sortRows(items,state,item=>planningOrderValues(item,all,reviews,payments))
}
