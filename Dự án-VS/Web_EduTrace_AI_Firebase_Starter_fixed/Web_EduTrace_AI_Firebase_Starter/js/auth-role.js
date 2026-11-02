const allowedRoles = new Set(['parent', 'center', 'doctor', 'investor']);
export function resolveRole(profileRole, claims = {}) {
  if (claims.admin === true) return 'admin';
  if (profileRole === 'investor') return 'center';
  return allowedRoles.has(profileRole) ? profileRole : 'parent';
}
