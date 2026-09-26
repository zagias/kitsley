// Keep the project's specification and required quantity together when searching.
export function retailerItems(items=[],materials=[]){
 return [...items.filter(i=>!i.owned&&i.qty!==0).map(i=>({name:i.name,query:[i.name,i.note].filter(Boolean).join(' · ').slice(0,200),quantity:Number.isInteger(i.qty)&&i.qty>0?Math.min(999,i.qty):1})),...materials.map(name=>({name,query:String(name).slice(0,200),quantity:1}))];
}
