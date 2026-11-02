import { getApp } from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js';
import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js';
import { getFirestore, collection, doc, query, where, getDocs, serverTimestamp, writeBatch } from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js';
const panel=document.getElementById('clinicalPanel'),content=document.getElementById('clinicalContent'),message=document.getElementById('clinicalMessage'),form=document.getElementById('clinicalForm'),list=document.getElementById('clinicalList'),stats=document.getElementById('clinicalStats');
const history=document.getElementById('clinicalHistory'),historyList=document.getElementById('clinicalHistoryList'),historyStatus=document.getElementById('clinicalHistoryStatus');
const auth=getAuth(getApp()),db=getFirestore(getApp());
let uid=null,selected=null,epoch=0,historyEpoch=0;
function reset(){selected=null;form.reset();history.hidden=true;historyList.replaceChildren();historyStatus.textContent='';historyEpoch++;}
async function showHistory(caseId,currentEpoch){
 const request=++historyEpoch;history.hidden=false;historyList.replaceChildren();historyStatus.textContent='Đang tải lịch sử...';
 try {const snapshot=await getDocs(collection(db,'clinicalCases',caseId,'history'));if(currentEpoch!==epoch||request!==historyEpoch||selected!==caseId)return;
 const entries=snapshot.docs.map(item=>item.data()).sort((a,b)=>(b.createdAt?.toMillis()||0)-(a.createdAt?.toMillis()||0));
 historyStatus.textContent=entries.length?`${entries.length} lần lưu`:'Chưa có lịch sử.';
 for(const entry of entries){const article=document.createElement('article');article.className='clinical-history-entry';const heading=document.createElement('strong');heading.textContent=entry.createdAt?.toDate().toLocaleString('vi-VN')||'Đang đồng bộ';article.append(heading);for(const [label,key] of [['Mã ca','code'],['Trạng thái','status'],['Đánh giá','assessment'],['Bài tập','exercise'],['Tiến độ','progress']]){const row=document.createElement('p');row.textContent=`${label}: ${key==='status'?(entry[key]==='completed'?'Hoàn thành':'Đang theo dõi'):(entry[key]||'—')}`;article.append(row);}historyList.append(article);}
 } catch {if(currentEpoch===epoch&&request===historyEpoch)historyStatus.textContent='Không tải được lịch sử. Hãy thử lại.';}
}
async function load(currentEpoch){const userId=uid;const snapshot=await getDocs(query(collection(db,'clinicalCases'),where('ownerUid','==',userId)));if(currentEpoch!==epoch||uid!==userId)return;
 const entries=snapshot.docs.map(item=>({id:item.id,...item.data()}));stats.textContent=`Tổng số ca: ${entries.length} · Đang theo dõi: ${entries.filter(item=>item.status==='active').length} · Hoàn thành: ${entries.filter(item=>item.status==='completed').length}`;list.replaceChildren();if(!entries.length)list.textContent='Chưa có ca nào.';
 for(const item of entries){const row=document.createElement('div');row.className='clinical-row';const label=document.createElement('span');label.textContent=`${item.code} · ${item.status==='completed'?'Hoàn thành':'Đang theo dõi'}`;const button=document.createElement('button');button.type='button';button.textContent='Xem / cập nhật';button.addEventListener('click',()=>{selected=item.id;for(const key of ['code','assessment','exercise','progress','status'])form.elements[key].value=item[key]||'';void showHistory(item.id,epoch);form.scrollIntoView({behavior:'smooth'});});row.append(label,button);list.append(row);}
}
onAuthStateChanged(auth,async user=>{const currentEpoch=++epoch;uid=null;reset();list.replaceChildren();stats.textContent='';content.hidden=true;panel.hidden=true;if(!user)return;
 try{const token=await user.getIdTokenResult();if(currentEpoch!==epoch)return;if(token.claims.clinician!==true){panel.hidden=false;message.textContent='Tài khoản chưa được quản trị viên cấp quyền chuyên môn.';return;}uid=user.uid;panel.hidden=false;message.textContent='Đang tải dữ liệu...';await load(currentEpoch);if(currentEpoch!==epoch)return;content.hidden=false;message.textContent='Chỉ tài khoản được cấp quyền mới truy cập được ca của mình.';}catch{if(currentEpoch===epoch){panel.hidden=false;message.textContent='Không tải được dữ liệu. Hãy kiểm tra quyền và kết nối.';}}
});
document.getElementById('clinicalReset').addEventListener('click',reset);
form.addEventListener('submit',async event=>{event.preventDefault();if(!uid)return;const button=form.querySelector('[type=submit]');button.disabled=true;const currentEpoch=epoch,userId=uid;
 const data=Object.fromEntries(['code','assessment','exercise','progress','status'].map(key=>[key,form.elements[key].value.trim()]));if(!data.code){message.textContent='Vui lòng nhập mã ca.';button.disabled=false;return;}
 try{const caseRef=selected?doc(db,'clinicalCases',selected):doc(collection(db,'clinicalCases'));const historyRef=doc(collection(caseRef,'history'));const batch=writeBatch(db);if(selected)batch.update(caseRef,{...data,lastHistoryId:historyRef.id,updatedAt:serverTimestamp()});else batch.set(caseRef,{...data,ownerUid:userId,lastHistoryId:historyRef.id,createdAt:serverTimestamp(),updatedAt:serverTimestamp()});batch.set(historyRef,{...data,createdAt:serverTimestamp()});await batch.commit();if(currentEpoch!==epoch)return;selected=caseRef.id;await load(currentEpoch);await showHistory(caseRef.id,currentEpoch);message.textContent='Đã lưu ca và lịch sử.';}catch{if(currentEpoch===epoch)message.textContent='Không lưu được ca. Hãy kiểm tra quyền và kết nối.';}finally{button.disabled=false;}
});
