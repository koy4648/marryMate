import { describe,expect,it } from 'vitest'
import { checklistLayoutKey,readChecklistLayouts,orderedCategories,moveCategory } from './checklist-layout'
describe('checklist layout preferences',()=>{
  it('keeps a saved order while appending new categories and removing missing ones',()=>{
    expect(orderedCategories(['본식','스튜디오','신혼여행'],['스튜디오','삭제됨','스튜디오','본식'])).toEqual(['스튜디오','본식','신혼여행'])
  })
  it('moves one category without changing its items or crossing the ends',()=>{
    const categories=['본식','스튜디오','신혼여행']
    const moved=moveCategory(categories,[],'스튜디오',-1)
    expect(moved).toEqual(['스튜디오','본식','신혼여행'])
    expect(moveCategory(categories,moved,'스튜디오',-1)).toEqual(moved)
    expect(categories).toEqual(['본식','스튜디오','신혼여행'])
  })
  it('restores independent category sorts and isolates users and workspaces',()=>{
    const first=checklistLayoutKey(1,3),second=checklistLayoutKey(2,3),third=checklistLayoutKey(1,4)
    expect(new Set([first,second,third]).size).toBe(3)
    const stored=readChecklistLayouts(JSON.stringify({[first]:{order:['본식','스튜디오'],sorts:{본식:{key:'amount',ascending:false},스튜디오:{key:'visitDate',ascending:true}}}}))
    expect(stored[first].sorts.본식).toEqual({key:'amount',ascending:false})
    expect(stored[first].sorts.스튜디오).toEqual({key:'visitDate',ascending:true})
    expect(stored[second]).toBeUndefined()
    expect(readChecklistLayouts('invalid')).toEqual({})
  })
})
