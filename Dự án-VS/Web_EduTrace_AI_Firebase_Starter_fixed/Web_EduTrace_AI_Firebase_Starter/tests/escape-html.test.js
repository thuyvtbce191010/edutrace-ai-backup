import { test } from 'node:test';
import assert from 'node:assert/strict';
import { escapeHtml } from '../js/escape-html.js';

test('mã hóa ký tự đặc biệt trong nội dung và thuộc tính HTML', () => {
  assert.equal(escapeHtml(`<img src="x" onerror='a'>&`), '&lt;img src=&quot;x&quot; onerror=&#39;a&#39;&gt;&amp;');
  assert.equal(escapeHtml(null), '');
});
