const AUTH_STORAGE_KEY = 'auth-user-v1';

export type UserRole = 'student' | 'lawyer';

export type AuthUser = {
  account: string;
  password: string;
  role: UserRole;
  loggedInAt: string;
};

function canUseStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

export function getAuthUser(): AuthUser | null {
  if (!canUseStorage()) return null;
  try {
    const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<AuthUser>;
    if (!parsed || typeof parsed !== 'object') return null;
    return {
      account: parsed.account || '匿名用户',
      password: parsed.password || '',
      role: parsed.role === 'lawyer' ? 'lawyer' : 'student',
      loggedInAt: parsed.loggedInAt || new Date().toISOString()
    };
  } catch {
    return null;
  }
}

export function isLoggedIn() {
  return Boolean(getAuthUser());
}

export function login(account: string, password: string, role: UserRole = 'student') {
  if (!canUseStorage()) return;
  const nextUser: AuthUser = {
    account: account.trim() || '匿名用户',
    password,
    role,
    loggedInAt: new Date().toISOString()
  };
  window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(nextUser));
}

export function logout() {
  if (!canUseStorage()) return;
  window.localStorage.removeItem(AUTH_STORAGE_KEY);
}
