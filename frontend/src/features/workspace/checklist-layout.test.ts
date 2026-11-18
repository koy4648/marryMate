import { describe,expect,it } from 'vitest'
import { checklistLayoutKey,readChecklistLayouts,orderedCategories,moveCategory } from './checklist-layout'
describe('checklist layout preferences',()=>{
  it('keeps a saved order while appending new categories and removing missing ones',()=>{
    expect(orderedCategories(['본식','스튜디오 촬영','신혼여행'],['스튜디오 촬영','삭제됨','스튜디오 촬영','본식'])).toEqual(['스튜디오 촬영','본식','신혼여행'])
  })
  it('moves one category without changing its items or crossing the ends',()=>{
    const categories=['본식','스튜디오 촬영','신혼여행']
    const moved=moveCategory(categories,[],'스튜디오 촬영',-1)
    expect(moved).toEqual(['스튜디오 촬영','본식','신혼여행'])
    expect(moveCategory(categories,moved,'스튜디오 촬영',-1)).toEqual(moved)
    expect(categories).toEqual(['본식','스튜디오 촬영','신혼여행'])
  })
  it('ignores the removed completion grouping preference while preserving order',()=>{
    const saved=readChecklistLayouts(JSON.stringify({'1:3':{order:['본식'],sorts:{},separateCompleted:true}}))
    expect(saved['1:3']).toEqual({order:['본식'],sorts:{}})
  })
  it('keeps category order and sorting when studio is renamed',()=>{
    const saved=readChecklistLayouts(JSON.stringify({'1:3':{order:['스튜디오','본식'],sorts:{스튜디오:{key:'amount',ascending:false}}}}))
    expect(saved['1:3'].order).toEqual(['스튜디오 촬영','본식'])
    expect(saved['1:3'].sorts['스튜디오 촬영']).toEqual({key:'amount',ascending:false})
  })
  it('restores independent category sorts and isolates users and workspaces',()=>{
    const first=checklistLayoutKey(1,3),second=checklistLayoutKey(2,3),third=checklistLayoutKey(1,4)
    expect(new Set([first,second,third]).size).toBe(3)
    const stored=readChecklistLayouts(JSON.stringify({[first]:{order:['본식','스튜디오 촬영'],sorts:{본식:{key:'amount',ascending:false},'스튜디오 촬영':{key:'visitDate',ascending:true}}}}))
    expect(stored[first].sorts.본식).toEqual({key:'amount',ascending:false})
    expect(stored[first].sorts['스튜디오 촬영']).toEqual({key:'visitDate',ascending:true})
    expect(stored[second]).toBeUndefined()
    expect(readChecklistLayouts('invalid')).toEqual({})
  })
})
