import { test } from 'node:test';
import assert from 'node:assert/strict';
import { updateRoleWorkspace } from '../js/role-workspace.js';

test('không gian hiển thị đúng vai trò và ẩn khi đăng xuất', () => {
  const ids = ['roleWorkspace', 'doctorWorkspace', 'investorWorkspace', 'roleWorkspaceBadge', 'roleWorkspaceTitle', 'roleWorkspaceGreeting'];
  const elements = Object.fromEntries(ids.map(id => [id, { hidden: true, textContent: '' }]));
  const root = { getElementById: id => elements[id] };
  updateRoleWorkspace({ role: 'doctor', displayName: 'Bác sĩ A' }, root);
  assert.equal(elements.roleWorkspace.hidden, false);
  assert.equal(elements.doctorWorkspace.hidden, false);
  assert.equal(elements.investorWorkspace.hidden, true);
  assert.match(elements.roleWorkspaceGreeting.textContent, /Bác sĩ A/);
  updateRoleWorkspace({ role: 'investor', displayName: 'Đối tác B' }, root);
  assert.equal(elements.doctorWorkspace.hidden, true);
  assert.equal(elements.investorWorkspace.hidden, false);
  assert.equal(elements.roleWorkspaceTitle.textContent, 'Không gian trung tâm');
  updateRoleWorkspace({ role: 'center' }, root);
  assert.equal(elements.investorWorkspace.hidden, false);
  updateRoleWorkspace(null, root);
  assert.equal(elements.roleWorkspace.hidden, true);
  updateRoleWorkspace({ role: 'parent' }, root);
  assert.equal(elements.roleWorkspace.hidden, true);
});
