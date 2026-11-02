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
