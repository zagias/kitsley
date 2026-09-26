import {workshopModel} from './bookcase-workshop.mjs';
const round=n=>Math.round(n*1e6)/1e6;
const factors={mm:1,cm:10,m:1000,inches:25.4,inch:25.4,in:25.4,'"':25.4,feet:304.8,foot:304.8,ft:304.8};
// A deliberately small grammar: ambiguous or composite requests never become a
// whole-cabinet resize. Other requests remain available to the research workflow.
export function shelfChange(record,text){
 text=String(text).replace(/(\d)-(\d+)\//g,'$1 $2/').replace(/[″”]/g,'\"');
 if(record.pack?.build?.version!==1||!/(?:shelf|shelves)/i.test(text))return null;
 const d=workshopModel(record.pack.input);
 if(/\ball (?:interior )?shelves (?:full depth|the same depth as (?:the )?(?:cabinet|carcass))\b/i.test(text))return {insets:Array(d.shelves).fill(0)};
 if(!/\b(top|upper|bottom|lower|middle|interior)\b|\bC[1-3]\b/i.test(text))return null;
 const number=text.match(/(?<![\d/.])(-?\d+(?:\s+\d+\/\d+|\/\d+|\.\d+)?)\s*(mm|cm|m|inches|inch|in|feet|foot|ft|")(?=\s|$|[.,?!])/i);
 const clarify=(question,choices=[])=>({clarification:{question,choices},text:'Your design is unchanged. Let’s make the requested change precise.'});
 const targetText=text.split(/\bthan\b/i)[0];
 const target=/\bC([1-3])\b/i.exec(targetText),which=target?Number(target[1])-1:/\b(top|upper)\b/i.test(targetText)?d.shelves-1:/\b(bottom|lower)\b/i.test(targetText)?0:/\bmiddle\b/i.test(targetText)&&d.shelves===3?1:d.shelves===1?0:null;
 const comparison=text.match(/\bthan\s+(?:the\s+)?(lower|bottom|upper|top)(?:\s+(two|three|2|3))?/i);
 const comparisonSuffix=comparison?' '+comparison[0]:'';
 const label=which===null?'interior shelf':d.shelfPanels[which]?.name.toLowerCase();
 if(which===null||!label)return clarify(`Which interior shelf should change? This design has ${d.shelves}, counted from the bottom.`);
 if(/\b(narrow|narrower|wide|width)\b/i.test(text)){
  if(/\b(width|wide|side.to.side)\b/i.test(text)&&!/\bnarrow/i.test(text))return {unsupported:'Reducing one shelf’s side-to-side width would remove its connection to a side. That needs a different support design; the current cabinet is unchanged.'};
  return clarify('Do you mean less deep from front to back, or less wide from side to side?',number?[`Make the ${label} ${number[1]} ${number[2]} shallower${comparisonSuffix}`,`Make the ${label} ${number[1]} ${number[2]} less wide`]:[]);
 }
 if(!/\b(deep|depth|shallower|setback|set back)\b/i.test(text))return null;
 if([...text.matchAll(/\d+(?:\.\d+)?\s*(?:mm|cm|inches|inch|feet|foot|ft|in)(?=\s|$|[.,?!])/gi)].length>1)return clarify('Please give one shelf depth change at a time, with its unit.');
 if(!number)return clarify('How much should this shelf change? Include mm or inches.');
 if(/\btop shelf\b/i.test(text)&&!/interior/i.test(text))return clarify('Do you mean the upper interior shelf or the cabinet’s top panel?', [`Make the ${label} ${number[1]} ${number[2]} ${/shallower|less deep/i.test(text)?'shallower':'deep'}`,'I mean the cabinet top panel']);
 if(/\b(and|also|plus)\b/i.test(text))return {unsupported:'Please change one shelf depth at a time so each part can be reviewed accurately.'};
 const mixed=number[1].match(/^(?:(\d+)\s+)?(\d+)\/(\d+)$/);
 if(mixed&&(!Number(mixed[3])||Number(mixed[2])>=Number(mixed[3])))return clarify('Check the fraction and give the shelf depth again.');
 const value=mixed?Number(mixed[1]||0)+Number(mixed[2])/Number(mixed[3]):Number(number[1]);
 const n=value*factors[number[2].toLowerCase()];
 const insets=[...d.shelfInsets];
 if(/shallower|less deep|reduce.*depth/i.test(text)){let reference=insets[which];if(comparison){const lower=/lower|bottom/i.test(comparison[1]);const candidates=lower?d.shelfPanels.filter(p=>p.index<which):d.shelfPanels.filter(p=>p.index>which);if(comparison[2]&&Number({two:2,three:3}[comparison[2]]||comparison[2])!==candidates.length)return clarify('Which lower or upper parts do you mean? Interior shelves are counted separately from the cabinet top and base.');if(!candidates.length)return clarify('Which shelf should I compare with?');if(new Set(candidates.map(p=>p.inset)).size>1)return clarify('Those shelves have different depths. Give the desired finished depth for this shelf.');reference=candidates[0].inset;}insets[which]=round(reference+n);}
 else if(/setback|set back/i.test(text))insets[which]=round(n);
 else insets[which]=round(d.panelDepth+d.edgeThickness-n);
 if(n<=0)return {unsupported:'Use a positive depth or setback, in mm or inches.'};
 // This also rejects too-shallow, deeper-than-cabinet and malformed dimensions.
 try{workshopModel({...record.pack.input,shelfInsets:insets});}catch(e){return {unsupported:e.message};}
 return {insets};
}
