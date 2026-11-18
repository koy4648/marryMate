import { describe,expect,it } from 'vitest'
import { venueContractTotal,venueBalance } from './venue-cost'

describe('venue meal cost and balance',()=>{
  it('adds guaranteed meals once and deducts existing installments',()=>{
    const total=venueContractTotal(70000,200,3000000)
    expect(total).toBe(17000000)
    expect(venueBalance(total,2000000,3000000)).toBe(12000000)
    expect(venueBalance(total,2000000,3000000)).toBe(12000000)
  })
  it('allows a fully covered balance and zero meal cost',()=>{
    expect(venueBalance(venueContractTotal(0,0,3000000),1000000,2000000)).toBe(0)
  })
  it('rejects negative balances, fractional guests and totals beyond the won limit',()=>{
    expect(()=>venueBalance(1000000,1000000,1)).toThrow('계약금과 중도금')
    expect(()=>venueContractTotal(70000,1.5,0)).toThrow('정수')
    expect(()=>venueContractTotal(999999999999999,2,0)).toThrow('15자리')
  })
})
