import { test } from 'node:test';
import assert from 'node:assert/strict';
import { extractKnowledge, youtubeUrl } from '../js/knowledge-extract.js';

test('chỉ chấp nhận và chuẩn hóa link YouTube', () => {
  assert.equal(youtubeUrl('https://youtu.be/9hE5-98ZeCg?t=5'), 'https://www.youtube.com/watch?v=9hE5-98ZeCg');
  assert.throws(() => youtubeUrl('https://youtube.com.example.com/watch?v=9hE5-98ZeCg'));
  assert.throws(() => youtubeUrl('https://youtube.com/watch?v=bad'));
});

test('gửi video qua file_data và không đặt khóa trong URL', async () => {
  let request;
  const text = await extractKnowledge({ source: { kind: 'youtube', url: 'https://youtube.com/watch?v=9hE5-98ZeCg' }, key: 'fake-key', model: 'gemini-3.8-flash', fetchImpl: async (url, options) => {
    request = { url, options, body: JSON.parse(options.body) };
    return { ok: true, json: async () => ({ candidates: [{ content: { parts: [{ text: 'Bản nháp' }] } }] }) };
  } });
  assert.equal(text, 'Bản nháp');
  assert.equal(request.body.contents[0].parts[1].file_data.file_uri, 'https://www.youtube.com/watch?v=9hE5-98ZeCg');
  assert.equal(request.options.headers['x-goog-api-key'], 'fake-key');
  assert.equal(request.url.includes('fake-key'), false);
});

test('gửi PDF hợp lệ và từ chối tệp giả', async () => {
  const bytes = new TextEncoder().encode('%PDF-1.4\nTEST');
  const file = { name: 'test.pdf', type: 'application/pdf', size: bytes.length, arrayBuffer: async () => bytes.buffer };
  let part;
  await extractKnowledge({ source: {kind:'pdf', file}, key:'fake', model:'gemini-3.8-flash', encode: data => Buffer.from(data,'binary').toString('base64'), fetchImpl: async (url, options) => {
    part = JSON.parse(options.body).contents[0].parts[1];
    return {ok:true,json:async()=>({candidates:[{content:{parts:[{text:'OK'}]}}]})};
  }});
  assert.equal(part.inline_data.mime_type, 'application/pdf');
  assert.equal(Buffer.from(part.inline_data.data,'base64').toString(), '%PDF-1.4\nTEST');
  await assert.rejects(extractKnowledge({source:{kind:'pdf',file:{...file,arrayBuffer:async()=>new TextEncoder().encode('bad file').buffer}},key:'fake',model:'gemini-3.8-flash'}), /PDF hợp lệ/);
});

test('báo lỗi khi Gemini không trả lời', async () => {
  await assert.rejects(extractKnowledge({source:{kind:'youtube',url:'https://youtu.be/9hE5-98ZeCg'},key:'fake',model:'gemini-3.8-flash',fetchImpl:async()=>({ok:true,json:async()=>({candidates:[]})})}), /không trả nội dung/);
});
