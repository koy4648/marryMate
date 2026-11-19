import { describe, expect, it } from 'vitest'
import { allMenus, normalizeMenuOrder, moveMenu } from './navigation'
describe('personal navigation order',()=>{
  it('preserves the server order rather than resetting to the default order',()=>{
    expect(normalizeMenuOrder(['budget','dashboard','meals'])).toEqual(['budget','dashboard','meals'])
    expect(normalizeMenuOrder(['meals','invalid','budget','meals'])).toEqual(['dashboard','meals','budget'])
  })
  it('moves any visible menu including home while preserving hidden menus',()=>{
    const selected=normalizeMenuOrder(['dashboard','meals','budget'])
    const next=moveMenu(selected,'budget',-1)
    expect(next).toEqual(['dashboard','budget','meals'])
    expect(moveMenu(next,'dashboard',1)).toEqual(['budget','dashboard','meals'])
    expect(normalizeMenuOrder(JSON.parse(JSON.stringify(next)))).toEqual(next)
    expect(selected).toEqual(['dashboard','meals','budget'])
  })
  it('keeps boundary moves and hidden menus unchanged',()=>{
    expect(moveMenu(allMenus,'dashboard',-1)).toEqual(allMenus)
    expect(moveMenu(allMenus,'budget',1)).toEqual(allMenus)
    expect(moveMenu(['dashboard','budget'],'meals',-1)).toEqual(['dashboard','budget'])
  })
})
