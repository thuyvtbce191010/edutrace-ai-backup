import { getApp } from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js';
import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js';
import { getFirestore, doc, getDoc, setDoc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js';
const auth=getAuth(getApp()), db=getFirestore(getApp()), form=document.getElementById('investorReportForm'), status=document.getElementById('investorAdminStatus');
let allowed=false, epoch=0;
onAuthStateChanged(auth, async user => {
 const current=++epoch; allowed=false; form.reset(); status.textContent='Đang kiểm tra báo cáo...';
 if (!user) return;
 try {const token=await user.getIdTokenResult(); if(current!==epoch||token.claims.admin!==true) return; allowed=true; const snap=await getDoc(doc(db,'investorReports','overview')); if(current!==epoch)return; if(!snap.exists()){status.textContent='Chưa có báo cáo được công bố.';return;} const data=snap.data(); for(const key of ['title','period','summary','users','partners','requests']) form.elements[key].value=data[key]??''; status.textContent='Đang hiển thị báo cáo đã công bố.'; }
 catch {if(current===epoch)status.textContent='Không tải được báo cáo. Kiểm tra quyền và kết nối.';}
});
form.addEventListener('submit',async event=>{event.preventDefault(); if(!allowed)return; const button=form.querySelector('[type=submit]'),current=epoch; button.disabled=true;
 try {const data={title:form.elements.title.value.trim(),period:form.elements.period.value.trim(),summary:form.elements.summary.value.trim(),users:Number(form.elements.users.value),partners:Number(form.elements.partners.value),requests:Number(form.elements.requests.value),updatedAt:serverTimestamp()}; if(!data.title||!data.period) throw Error('invalid'); await setDoc(doc(db,'investorReports','overview'),data);if(current===epoch)status.textContent='Đã công bố báo cáo cho nhà đầu tư được cấp quyền.';} catch{if(current===epoch)status.textContent='Không công bố được báo cáo. Hãy kiểm tra dữ liệu, quyền và kết nối.';} finally{button.disabled=false;}
});
