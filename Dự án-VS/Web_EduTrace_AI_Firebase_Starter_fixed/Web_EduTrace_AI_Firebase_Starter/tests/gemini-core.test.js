import { test } from 'node:test';
import assert from 'node:assert/strict';
import { generateGemini } from '../functions/gemini-core.js';

test('chặn yêu cầu chưa đăng nhập hoặc dữ liệu không hợp lệ', async () => {
  await assert.rejects(generateGemini({ data: {}, apiKey: 'key' }), /unauthenticated/);
  await assert.rejects(generateGemini({ caller: { uid: 'u' }, data: { messages: [{ role: 'system', text: 'x' }] }, apiKey: 'key' }), /invalid-argument/);
});

test('khóa chỉ được gửi qua header đến Gemini và phản hồi trả về văn bản', async () => {
  let captured;
  const fetchImpl = async (url, options) => { captured = { url, options }; return { ok: true, json: async () => ({ candidates: [{ content: { parts: [{ text: 'OK' }] } }] }) }; };
  const result = await generateGemini({ caller: { uid: 'u' }, data: { messages: [{ role: 'user', text: 'Xin chào' }] }, apiKey: 'secret-value', fetchImpl });
  assert.equal(result.text, 'OK');
  assert.equal(captured.options.headers['x-goog-api-key'], 'secret-value');
  assert.equal(captured.url.includes('secret-value'), false);
});
