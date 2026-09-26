export async function downloadProjectPDF(payload){
 const response=await fetch('/api/project-pdf',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
 if(!response.ok){const data=await response.json().catch(()=>({}));throw Error(data.error||'The PDF could not be prepared. Please try again.');}
 const blob=await response.blob(),url=URL.createObjectURL(blob),a=document.createElement('a');
 a.href=url;a.download='kitsley-'+(payload.record?.guideId||'bookcase')+'-'+payload.kind+'.pdf';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);
}
