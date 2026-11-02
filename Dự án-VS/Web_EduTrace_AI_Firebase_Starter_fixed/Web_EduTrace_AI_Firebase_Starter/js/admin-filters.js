// Filter the complete list available to the current browser session.
export function filterUsers(users, { search = '', role = 'all', status = 'all' } = {}) {
  const query = search.trim().toLowerCase();
  return users.filter(user => {
    const matchesSearch = !query || [user.displayName, user.email, user.phone]
      .some(value => String(value || '').toLowerCase().includes(query));
    return matchesSearch && (role === 'all' || user.role === role) &&
      (status === 'all' || (user.status || 'active') === status);
  });
}

export function filterActivities(items, { type = 'all', status = 'all' } = {}) {
  return items.filter(item => (type === 'all' || item.type === type) &&
    (status === 'all' || item.status === status));
}
