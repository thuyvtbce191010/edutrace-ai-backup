function csvCell(value) {
  let text = String(value ?? '');
  // Prevent spreadsheet applications interpreting user-provided values as formulas.
  if (/^[\s\u0000-\u001f]*[=+\-@]/.test(text)) text = "'" + text;
  return `"${text.replace(/"/g, '""')}"`;
}

export function createUsersCsv(users, roleLabels) {
  const rows = [['UID', 'Họ Tên', 'Email', 'Số Điện Thoại', 'Vai Trò', 'Trạng Thái', 'Ngày Tham Gia']];
  for (const user of users) {
    rows.push([user.uid, user.displayName, user.email, user.phone,
      roleLabels[user.role] || user.role,
      user.status === 'blocked' ? 'Tạm khóa' : 'Hoạt động', user.createdAt]);
  }
  return '\uFEFF' + rows.map(row => row.map(csvCell).join(',')).join('\r\n') + '\r\n';
}
