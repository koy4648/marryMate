import { describe, expect, it } from 'vitest'
import { gatheringPeople, isGathering } from './gatherings'
import { calendarEvents, type PlanningItem } from './planning'
import { budgetEstimates } from '../budget/estimates'
const meeting: PlanningItem = {id:1,serviceGroup:'청모',itemName:'대학 친구 청모',vendorName:'식당',status:'SCHEDULED',scheduleDate:'2026-12-12',scheduleTime:'18:30',quotedAmount:300000,actualAmount:0,packageContract:false,packageBaseAmount:0,packageAdditionalAmount:0,packageIncludedItems:'',packageAdditionalDetails:'',rating:null,reviewType:'NONE',review:'',pros:'',cons:'',memo:'',expectedAttendees:5,attendees:[{name:'친구 A',side:'BRIDE'},{name:'친구 B',side:'GROOM'},{name:'친구 C',side:'BOTH'}]}
describe('gatherings',()=>{
  it('keeps family meetings in the checklist and vendor comparison',()=>{
    expect(isGathering(meeting)).toBe(true)
    expect(isGathering({...meeting,serviceGroup:'상견례',itemName:'상견례 식사'})).toBe(false)
    expect(isGathering({...meeting,serviceGroup:'식사',itemName:'상견례 선물'})).toBe(false)
  })
  it('counts named guests by side while retaining unnamed seats',()=>{
    expect(gatheringPeople(meeting)).toEqual({total:5,named:3,bride:1,groom:1,both:1})
    expect(gatheringPeople({...meeting,expectedAttendees:1}).total).toBe(3)
    expect(gatheringPeople({})).toEqual({total:0,named:0,bride:0,groom:0,both:0})
  })
  it('automatically adds a timed gathering and its headcount to the calendar',()=>{
    const events=calendarEvents([meeting],[])
    expect(events).toEqual([{id:'plan-1',date:'2026-12-12',time:'18:30',title:'대학 친구 청모',detail:'청모 · 식당 · 5명',kind:'planning',done:false}])
    expect(calendarEvents([{...meeting,status:'SKIPPED'}],[])).toEqual([])
  })
  it('keeps separate gatherings with equal names in the budget',()=>{
    const rows=budgetEstimates([{...meeting,status:'CONTRACTED'},{...meeting,id:2,status:'CONTRACTED'}],[],[],true,true)
    expect(rows).toHaveLength(2)
    expect(rows.reduce((sum,row)=>sum+row.planned,0)).toBe(600000)
  })
})
