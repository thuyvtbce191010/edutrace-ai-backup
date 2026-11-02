import { test } from 'node:test';
import assert from 'node:assert/strict';
import { paginate, updatePagination } from '../js/pagination.js';

test('chia danh sách thành các trang và giữ nguyên thứ tự', () => {
  const data = Array.from({ length: 23 }, (_, index) => index + 1);
  assert.deepEqual(paginate(data, 2, 10), { items: [11, 12, 13, 14, 15, 16, 17, 18, 19, 20], page: 2, pageCount: 3, total: 23 });
  assert.deepEqual(paginate(data, 3, 10).items, [21, 22, 23]);
});

test('giới hạn số trang khi danh sách thay đổi hoặc rỗng', () => {
  assert.equal(paginate([1, 2], 4, 1).page, 2);
  assert.equal(paginate([1], -1).page, 1);
  assert.deepEqual(paginate([], 5), { items: [], page: 1, pageCount: 1, total: 0 });
  assert.throws(() => paginate([], 1, 0), RangeError);
});

test('cập nhật trạng thái nút và tổng số kết quả', () => {
  const controls = { previous: {}, next: {}, status: {} };
  const container = { querySelector: selector => controls[selector.match(/"(.*?)"/)[1]] };
  updatePagination(container, paginate([1, 2, 3], 2, 2));
  assert.equal(controls.previous.disabled, false);
  assert.equal(controls.next.disabled, true);
  assert.equal(controls.status.textContent, 'Trang 2/2 · 3 kết quả');
});
