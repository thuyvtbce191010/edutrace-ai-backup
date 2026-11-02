// Dependency-injected logic so authorization and failure paths can be tested locally.
export async function manageAccount({ caller, data, auth, profiles }) {
  if (!caller?.uid || caller.token?.admin !== true) throw new Error('permission-denied');
  const { action, uid } = data || {};
  if (action === 'create') {
    const { email, password, displayName, phone = '', role } = data;
    if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) ||
        typeof password !== 'string' || password.length < 6 ||
        typeof displayName !== 'string' || !displayName.trim() || displayName.length > 100 ||
        typeof phone !== 'string' || phone.length > 20 ||
        !['parent', 'center', 'doctor', 'investor'].includes(role)) throw new Error('invalid-argument');
    const user = await auth.createUser({ email: email.trim().toLowerCase(), password, displayName: displayName.trim() });
    try {
      await profiles.create(user.uid, { uid: user.uid, email: user.email, displayName: displayName.trim(), phone: phone.trim(), role, status: 'active' });
    } catch (error) {
      try { await auth.deleteUser(user.uid); } catch (rollbackError) {
        return { action, uid: user.uid, authCreated: true, profileCreated: false, rollbackFailed: true };
      }
      throw new Error('profile-create-failed');
    }
    return { action, uid: user.uid, authCreated: true, profileCreated: true };
  }
  if (!['disable', 'enable', 'delete'].includes(action) || typeof uid !== 'string' || !uid.trim()) {
    throw new Error('invalid-argument');
  }
  if (uid === caller.uid) throw new Error('cannot-modify-self');
  const target = await auth.getUser(uid);
  if (target.customClaims?.admin === true) throw new Error('cannot-modify-admin');
  if (action === 'delete') {
    // Auth deletion and Firestore deletion cannot be committed atomically.
    await auth.deleteUser(uid);
    try { await profiles.delete(uid); } catch (error) {
      return { action, authDeleted: true, profileDeleted: false };
    }
    return { action, authDeleted: true, profileDeleted: true };
  }
  const disabled = action === 'disable';
  await auth.updateUser(uid, { disabled });
  if (disabled) {
    try { await auth.revokeRefreshTokens(uid); } catch (error) {
      return { action, authUpdated: true, tokensRevoked: false, profileUpdated: false };
    }
  }
  try { await profiles.setStatus(uid, disabled ? 'blocked' : 'active'); } catch (error) {
    return { action, authUpdated: true, profileUpdated: false };
  }
  return { action, authUpdated: true, profileUpdated: true };
}
