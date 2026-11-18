import type { SortState } from './sorting'
export type ChecklistLayout = { order:string[]; sorts:Record<string,SortState> }
export const checklistLayoutsStorageKey='marry-mate:v2:checklist-layouts'
export function checklistLayoutKey(userId:number,workspaceId:number) { return `${userId}:${workspaceId}` }
export function readChecklistLayouts(raw:string|null):Record<string,ChecklistLayout> {
  try {
    const parsed=JSON.parse(raw??'{}'); const result:Record<string,ChecklistLayout>={}
    if(!parsed||typeof parsed!=='object'||Array.isArray(parsed))return result
    for(const [key,value] of Object.entries(parsed)) {
      if(!value||typeof value!=='object')continue
      const entry=value as Partial<ChecklistLayout>; const groupName=(name:string)=>name==='스튜디오'?'스튜디오 촬영':name; const sorts:Record<string,SortState>={}
      for(const [group,sort] of Object.entries(entry.sorts??{})) {
        if(sort&&['default','amount','dueDate','payer','visitDate','name'].includes(sort.key)&&typeof sort.ascending==='boolean')sorts[groupName(group)]=sort
      }
      result[key]={order:Array.isArray(entry.order)?entry.order.filter(name=>typeof name==='string').map(groupName):[],sorts}
    }
    return result
  }catch{return {}}
}
export function orderedCategories(current:string[],saved:string[]) {
  return [...new Set([...saved.filter(name=>current.includes(name)),...current])]
}
export function moveCategory(current:string[],saved:string[],name:string,direction:number) {
  const result=orderedCategories(current,saved); const index=result.indexOf(name); const target=index+direction
  if(index<0||target<0||target>=result.length)return result
  ;[result[index],result[target]]=[result[target],result[index]]
  return result
}
