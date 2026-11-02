const allowedRoles = new Set(['parent', 'center', 'doctor', 'investor']);
export function resolveRole(profileRole, claims = {}) {
  return claims.admin === true ? 'admin' : (allowedRoles.has(profileRole) ? profileRole : 'parent');
}
