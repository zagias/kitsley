import {merchants,products,projects} from './catalog.mjs';
export function validLink(value,merchantId){try{const u=new URL(value),m=merchants.find(m=>m.id===merchantId);return !!m&&u.protocol==='https:'&&!u.username&&!u.password&&!u.port&&(u.hostname===m.host||u.hostname===m.host.replace(/^www\./,''));}catch{return false;}}
export function validateInput(input){
 if(!input || typeof input!=='object')throw new Error('Provide project details.');
 if(typeof input.description!=='string'||input.description.length>2000)throw new Error('Describe the project in 2,000 characters or fewer.');
 if(!['mdf','plywood','solid'].includes(input.material))throw new Error('Choose a material.');
 if(!['paint','clear','none'].includes(input.finish))throw new Error('Choose a finish.');
 if(!Array.isArray(input.owned)||input.owned.length>100||input.owned.some(id=>!products.some(p=>p.id===id)))throw new Error('Choose tools from the catalog.');
 if(input.projectId && !projects.some(p=>p.id===input.projectId))throw new Error('Choose a supported project.');
 return input;
}
