import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createCloudPager } from '../js/cloud-page.js';

test('tải từng trang, kết thúc, và tải lại từ đầu', async () => {
  const data = { users: [1, 2, 3, 4, 5] };
  const pager = createCloudPager(['users'], async (name, cursor, size) => data[name].slice(cursor || 0, (cursor || 0) + size), 2);
  assert.deepEqual((await pager.next()).pages.users, [1, 2]);
  assert.deepEqual((await pager.next()).pages.users, [3, 4]);
  const last = await pager.next();
  assert.deepEqual(last.pages.users, [5]);
  assert.equal(last.hasMore, false);
  pager.reset();
  assert.deepEqual((await pager.next()).pages.users, [1, 2]);
});

test('lỗi một collection không làm mất trang của collection khác khi thử lại', async () => {
  let fail = true;
  const calls = [];
  const pager = createCloudPager(['leads', 'bookingRequests'], async (name, cursor) => {
    calls.push([name, cursor]);
    if (name === 'bookingRequests' && fail) throw new Error('permission-denied');
    return [name + '-1'];
  }, 2);
  await assert.rejects(pager.next(), /permission-denied/);
  fail = false;
  const result = await pager.next();
  assert.deepEqual(result.pages.leads, ['leads-1']);
  assert.deepEqual(calls, [['leads', null], ['bookingRequests', null], ['leads', null], ['bookingRequests', null]]);
});

test('các yêu cầu đồng thời dùng cùng một trang', async () => {
  let calls = 0;
  const pager = createCloudPager(['users'], async () => { calls++; return [1]; }, 2);
  const [first, second] = await Promise.all([pager.next(), pager.next()]);
  assert.equal(calls, 1);
  assert.deepEqual(first, second);
});
