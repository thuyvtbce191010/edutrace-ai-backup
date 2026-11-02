import { test } from 'node:test';
import assert from 'node:assert/strict';
import { filterUsers, filterActivities } from '../js/admin-filters.js';
import { paginate } from '../js/pagination.js';

test('tìm kiếm người dùng không phân biệt hoa thường và kết hợp bộ lọc', () => {
  const users = [
    { displayName: 'An Nguyen', email: 'an@example.com', role: 'parent' },
    { displayName: 'Binh', phone: '0901234567', role: 'doctor', status: 'blocked' },
    { displayName: 'AN Binh', role: 'doctor', status: 'active' }
  ];
  assert.deepEqual(filterUsers(users, { search: ' AN ', role: 'doctor' }), [users[2]]);
  assert.deepEqual(filterUsers(users, { search: '0901', status: 'blocked' }), [users[1]]);
  assert.deepEqual(filterUsers(users, { status: 'active' }), [users[0], users[2]]);
});

test('lọc yêu cầu trước khi phân trang', () => {
  const items = Array.from({ length: 25 }, (_, i) => ({ type: i % 2 ? 'booking' : 'consultation', status: 'pending', id: i }));
  const filtered = filterActivities(items, { type: 'booking', status: 'pending' });
  assert.equal(filtered.length, 12);
  assert.deepEqual(paginate(filtered, 2, 10).items.map(item => item.id), [21, 23]);
  assert.deepEqual(filterActivities(items, { status: 'confirmed' }), []);
});
