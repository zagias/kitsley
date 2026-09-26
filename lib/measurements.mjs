export function millimetres(value,unit='mm'){
 const factors={mm:1,cm:10,m:1000,in:25.4,inch:25.4,inches:25.4,'"':25.4,ft:304.8,foot:304.8,feet:304.8,"'":304.8};
 const n=Number(value)*factors[unit.toLowerCase()];
 if(!Number.isFinite(n)||n<=0)throw Error('Use a positive measurement with mm, cm, m, inches or feet.');
 return Math.round(n);
}
export function parseDimensions(text){
 const match=text.trim().match(/^(\d+(?:\.\d+)?)\s*[x×,]\s*(\d+(?:\.\d+)?)\s*[x×,]\s*(\d+(?:\.\d+)?)\s*(mm|cm|m|inches|inch|in|feet|foot|ft|")?$/i);
 if(!match)return null;
 return {width:millimetres(match[1],match[4]||'mm'),height:millimetres(match[2],match[4]||'mm'),depth:millimetres(match[3],match[4]||'mm')};
}
