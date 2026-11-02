import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

async function loadService(savedModel, response) {
  const source = await readFile(new URL('../js/gemini-service.js', import.meta.url), 'utf8');
  const storage = new Map([['edutrace_gemini_model', savedModel], ['edutrace_gemini_api_key', 'fake-test-key']]);
  const window = {};
  let endpoint;
  vm.runInNewContext(source, { window, localStorage: { getItem: key => storage.get(key), setItem: (key, value) => storage.set(key, value) }, performance, fetch: async url => { endpoint = url; return response; } });
  return { service: window.geminiService, endpoint: () => endpoint };
}

test('model cũ được thay bằng model mặc định còn hỗ trợ', async () => {
  const { service } = await loadService('gemini-1.5-flash', {});
  assert.equal(service.getModel(), 'gemini-3.5-flash-lite');
});

test('kiểm tra kết nối không báo thành công nếu Gemini trả nội dung rỗng', async () => {
  const { service, endpoint } = await loadService('gemini-1.5-pro', { ok: true, json: async () => ({ candidates: [] }) });
  const result = await service.testConnection();
  assert.equal(result.success, false);
  assert.ok(endpoint().includes('/gemini-3.5-flash-lite:generateContent'));
});

test('kiểm tra kết nối nhận phản hồi thực sự', async () => {
  const { service } = await loadService('gemini-3.6-flash', { ok: true, json: async () => ({ candidates: [{ content: { parts: [{ text: 'OK' }] } }] }) });
  assert.equal((await service.testConnection()).message, 'OK');
});

test('Gemini chờ tri thức cloud trước khi tạo prompt', async () => {
  const source = await readFile(new URL('../js/gemini-service.js', import.meta.url), 'utf8');
  let release; let ready = false; let sentBody;
  const wait = new Promise(resolve => { release = () => { ready = true; resolve(); }; });
  const window = { waitForEduTraceKnowledge: () => wait, buildFullSystemPrompt: () => ready ? 'Tri thức mới' : 'Chưa tải' };
  vm.runInNewContext(source, { window, localStorage: { getItem: key => key === 'edutrace_gemini_api_key' ? 'fake-test-key' : null }, fetch: async (url, options) => { sentBody = JSON.parse(options.body); return { ok: true, json: async () => ({ candidates: [{ content: { parts: [{ text: 'OK' }] } }] }) }; } });
  const request = window.geminiService.sendChatMessage('Xin chào');
  assert.equal(sentBody, undefined);
  release();
  await request;
  assert.equal(sentBody.systemInstruction.parts[0].text, 'Tri thức mới');
});

test('không gọi Gemini khi không tải được tri thức cloud', async () => {
  const source = await readFile(new URL('../js/gemini-service.js', import.meta.url), 'utf8');
  let called = false;
  const window = { waitForEduTraceKnowledge: async () => { throw new Error('KNOWLEDGE_UNAVAILABLE'); } };
  vm.runInNewContext(source, { window, localStorage: { getItem: () => 'fake-test-key' }, fetch: async () => { called = true; } });
  await assert.rejects(window.geminiService.sendChatMessage('Xin chào'), /KNOWLEDGE_UNAVAILABLE/);
  assert.equal(called, false);
});
