import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createUsersCsv } from '../js/admin-csv.js';

test('CSV bảo toàn dấu phẩy, dấu nháy và vô hiệu hóa công thức', () => {
  const csv = createUsersCsv([{ uid: '1', displayName: 'A, "B"', email: '=1+1', phone: '0901', role: 'parent', status: 'blocked' }], { parent: 'Phụ huynh' });
  assert.ok(csv.startsWith('\uFEFF'));
  assert.match(csv, /"A, ""B"""/);
  assert.ok(csv.includes('"\'=1+1"'));
  assert.ok(csv.includes('"Tạm khóa"'));
});
