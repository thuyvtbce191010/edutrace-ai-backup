import { getApp } from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js';
import { getFirestore, collection, doc, onSnapshot, addDoc, updateDoc, deleteDoc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js';
const db=getFirestore(getApp()), items=collection(db,'knowledge');
let cached=[], ready=false;
window.edutraceCloudKnowledgeItems=()=>cached;
window.getStoredDynamicKnowledge=()=>cached;
window.edutraceKnowledgeStatus=()=>ready;
window.waitForEduTraceKnowledge=()=>{
 if(ready)return Promise.resolve();
 return new Promise((resolve,reject)=>{
  const timer=setTimeout(()=>{window.removeEventListener('edutrace:knowledge-cloud-changed',onChange);reject(new Error('KNOWLEDGE_UNAVAILABLE'));},10000);
  function onChange(event){if(event.detail.ready){clearTimeout(timer);window.removeEventListener('edutrace:knowledge-cloud-changed',onChange);resolve();}}
  window.addEventListener('edutrace:knowledge-cloud-changed',onChange);
  if(ready){clearTimeout(timer);window.removeEventListener('edutrace:knowledge-cloud-changed',onChange);resolve();}
 });
};
function media(item, kind){
 if(!item)return null;
 if(item.storageKey || item.source==='upload') throw new Error('Tệp tải trực tiếp chưa được lưu lên cloud. Vui lòng dùng liên kết HTTPS.');
 let url;try{url=new URL(item.url);}catch{throw new Error('Liên kết tài liệu hoặc video không hợp lệ.');}
 if(url.protocol!=='https:')throw new Error('Liên kết tài liệu hoặc video phải dùng HTTPS.');
 if(kind==='file')return {name:String(item.name||'Tài liệu'),url:url.href,description:String(item.description||'')};
 return {title:String(item.title||'Video'),url:url.href};
}
function normalize(item){return {title:String(item.title||'').trim(),category:String(item.category||''),author:String(item.author||''),content:String(item.content||'').trim(),file:media(item.file,'file'),video:media(item.video,'video')};}
function assertReady(){if(!ready)throw new Error('Chưa kết nối được kho tri thức cloud.');}
window.saveDynamicKnowledge=async item=>{assertReady();await addDoc(items,{...normalize(item),createdAt:serverTimestamp(),updatedAt:serverTimestamp()});};
window.updateDynamicKnowledge=async(id,item)=>{assertReady();await updateDoc(doc(items,id),{...normalize(item),updatedAt:serverTimestamp()});};
window.deleteDynamicKnowledge=async id=>{assertReady();await deleteDoc(doc(items,id));};
onSnapshot(items,{includeMetadataChanges:true},snapshot=>{cached=snapshot.docs.map(item=>{const data=item.data();return {id:item.id,...data,file:data.file?{...data.file,source:'url'}:null,video:data.video?{...data.video,source:'url',youtubeId:window.parseYouTubeId?.(data.video.url)}:null};});ready=!snapshot.metadata.fromCache&&!snapshot.metadata.hasPendingWrites;window.dispatchEvent(new CustomEvent('edutrace:knowledge-cloud-changed',{detail:{ready,count:cached.length}}));},()=>{ready=false;window.dispatchEvent(new CustomEvent('edutrace:knowledge-cloud-changed',{detail:{ready:false,count:cached.length}}));});
