import { describe,expect,it } from 'vitest'
import { sortRows,defaultSort,paymentOrderValues } from './sorting'
import type { Payment } from '../budget/budget'
describe('list sorting',()=>{
  const rows=[{id:1,amount:900,payer:'신부',dueDate:'2027-02-01'},{id:2,amount:12000,payer:'공동',dueDate:null},{id:3,amount:1000,payer:'신랑',dueDate:'2027-01-01'}]
  it('compares amounts numerically in both directions without changing source data',()=>{
    expect(sortRows(rows,{key:'amount',ascending:true},row=>row).map(row=>row.id)).toEqual([1,3,2])
    expect(sortRows(rows,{key:'amount',ascending:false},row=>row).map(row=>row.id)).toEqual([2,3,1])
    expect(rows.map(row=>row.id)).toEqual([1,2,3])
    expect(sortRows(rows,defaultSort,row=>row)).toEqual(rows)
  })
  it('puts missing dates last in either direction',()=>{
    expect(sortRows(rows,{key:'dueDate',ascending:true},row=>row).map(row=>row.id)).toEqual([3,1,2])
    expect(sortRows(rows,{key:'dueDate',ascending:false},row=>row).map(row=>row.id)).toEqual([1,3,2])
  })
  it('sorts payers by Korean names and keeps equal values stable',()=>{
    expect(sortRows(rows,{key:'payer',ascending:true},row=>row).map(row=>row.payer)).toEqual(['공동','신랑','신부'])
    expect(sortRows([{id:1,amount:1},{id:2,amount:1}],{key:'amount',ascending:false},row=>row).map(row=>row.id)).toEqual([1,2])
  })
  it('uses the next unpaid date and ignores cancelled payments',()=>{
    const payment={id:1,planningItemId:1,title:'결제',category:'기타',type:'OTHER',scheduledAmount:100,actualAmount:0,dueDate:'2027-01-01',paidDate:null,payer:'공동',status:'SCHEDULED'} as Payment
    expect(paymentOrderValues([{...payment,status:'PAID',dueDate:'2026-01-01'}, {...payment,id:2,dueDate:'2027-03-01'}, {...payment,id:3,status:'CANCELLED',dueDate:'2027-02-01',payer:'기타'}])).toEqual({dueDate:'2027-03-01',payer:'공동'})
  })
})
