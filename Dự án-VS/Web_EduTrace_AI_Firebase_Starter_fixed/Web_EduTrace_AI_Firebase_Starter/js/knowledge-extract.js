const PROMPT = 'Hãy trích xuất thông tin có trong nguồn thành bản nháp tiếng Việt, ghi rõ các điểm quan trọng và giới hạn hoặc phần không chắc chắn. Không tự bổ sung sự kiện, không đưa ra chẩn đoán hoặc chỉ định điều trị. Giữ nguyên các cảnh báo an toàn của nguồn. Trả về văn bản ngắn gọn để chuyên gia kiểm tra trước khi công bố.';
export function youtubeUrl(value) {
  let url; try { url = new URL(value); } catch { throw new Error('Vui lòng nhập link YouTube hợp lệ.'); }
  const host = url.hostname.toLowerCase();
  if (url.protocol !== 'https:' || !['youtube.com','www.youtube.com','m.youtube.com','youtu.be'].includes(host)) throw new Error('Chỉ hỗ trợ link YouTube HTTPS công khai.');
  const id = host === 'youtu.be' ? url.pathname.slice(1).split('/')[0] : url.pathname === '/watch' ? url.searchParams.get('v') : url.pathname.match(/^\/(?:shorts|embed)\/([\w-]{11})/)?.[1];
  if (!id || !/^[\w-]{11}$/.test(id)) throw new Error('Không tìm thấy mã video YouTube hợp lệ.');
  return `https://www.youtube.com/watch?v=${id}`;
}
export async function extractKnowledge({ source, key, model, fetchImpl=fetch, encode=btoa }) {
  if (!key) throw new Error('Chưa cấu hình Gemini API key trong trang quản trị.');
  if (!/^[\w.-]+$/.test(model || '')) throw new Error('Model Gemini không hợp lệ.');
  let media;
  if(source?.kind==='pdf'){
    const file=source.file;
    if(!file || !(file.type==='application/pdf' || /\.pdf$/i.test(file.name))) throw new Error('Vui lòng chọn tệp PDF.');
    if(file.size===0 || file.size>8*1024*1024) throw new Error('PDF phải có dung lượng từ 1 byte đến 8 MB.');
    const bytes=new Uint8Array(await file.arrayBuffer());
    if(bytes.length<5 || String.fromCharCode(...bytes.slice(0,5))!=='%PDF-') throw new Error('Tệp không phải PDF hợp lệ.');
    let binary='';for(let i=0;i<bytes.length;i+=32768)binary+=String.fromCharCode(...bytes.subarray(i,i+32768));
    media={inline_data:{mime_type:'application/pdf',data:encode(binary)}};
  }else if(source?.kind==='youtube') media={file_data:{file_uri:youtubeUrl(source.url)}};
  else throw new Error('Nguồn tài liệu không được hỗ trợ.');
  const response=await fetchImpl(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,{method:'POST',headers:{'Content-Type':'application/json','x-goog-api-key':key},body:JSON.stringify({contents:[{role:'user',parts:[{text:PROMPT},media]}],generationConfig:{maxOutputTokens:3000}}),signal:AbortSignal.timeout(120000)});
  if(!response.ok){const details=await response.json().catch(()=>null);throw new Error(details?.error?.message || `Gemini trả lỗi ${response.status}.`);}
  const result=await response.json();const text=result?.candidates?.[0]?.content?.parts?.map(part=>part.text||'').join('').trim();
  if(!text)throw new Error('Gemini không trả nội dung. Hãy kiểm tra nguồn hoặc thử lại.');
  if(text.length>20000)throw new Error('Kết quả quá dài. Hãy thử với tài liệu ngắn hơn.');
  return text;
}
