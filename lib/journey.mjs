// Labels shared by home, project lists, setup and project details.
export const setupLabels={scope:'The job',constraint:'Your space',experience:'Your experience'};
export function projectTitle(record){return record.title?.trim()||record.request?.trim()||'Untitled project';}
export function projectStage(record){
 if(record.archived)return 'Archived';
 if(record.urgent)return 'Safety guidance';
 if(record.pack||record.instructionProgress?.scopeAccepted)return 'In progress';
 if(record.messages?.some(m=>m.source==='ai')||record.discovery)return 'Advice ready';
 if(record.setup?.version===1)return Object.keys(record.setup.answers||{}).length>=3?'Ready for advice':'Getting started';
 return record.messages?.length?'In progress':'Getting started';
}
export function safeReturnPath(value){
 if(typeof value!=='string'||value.length>300||!value.startsWith('/')||value.startsWith('//')||/[\\\r\n]/.test(value))return '/';
 try{const url=new URL(value,'https://kitsley.invalid');return url.origin==='https://kitsley.invalid'&&/^\/(project\/[\w-]+|offers|projects|toolbox|library|guides\/[\w-]+)?$/.test(url.pathname)?url.pathname+url.search:'/';}catch{return '/';}
}
