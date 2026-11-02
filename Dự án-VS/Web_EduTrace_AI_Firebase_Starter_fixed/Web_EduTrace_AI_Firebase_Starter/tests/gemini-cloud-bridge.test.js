import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

test('khi bật bridge, Gemini gọi máy chủ và không dùng khóa trình duyệt', async () => {
  const source = await readFile(new URL('../js/gemini-service.js', import.meta.url), 'utf8');
  const calls = [];
  const window = { edutraceGeminiCloud: { available: true, generate: async (messages, mode) => {
    calls.push({ messages, mode });
    return mode === 'assessment' ? JSON.stringify({ ageGroup: '', extractedKeywords: [{ text: 'test' }], advice: 'test', recommendedExerciseIds: [] }) : 'reply';
  } } };
  const localStorage = { getItem: () => 'old-browser-key', setItem: () => { throw new Error('Không được lưu khóa'); } };
  vm.runInNewContext(source, { window, localStorage, performance });
  assert.equal(window.geminiService.getApiKey(), '');
  assert.equal(await window.geminiService.sendChatMessage('hello', []), 'reply');
  assert.equal((await window.geminiService.analyzeAssessment('test')).advice, 'test');
  assert.equal(calls[1].mode, 'assessment');
  assert.throws(() => window.geminiService.setApiKey('new-key'), /máy chủ/);
});
