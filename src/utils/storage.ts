export const STORAGE_KEYS = {
  USER_PREFERENCES: "gf_user_prefs",
  DRAFT_STATUS: "gf_draft_status",
  SEARCH_HISTORY: "gf_search_history",
  THEME: "gf_theme",
} as const;

export function getLocal<T>(key: string, defaultValue?: T): T | null {
  try {
    const item = window.localStorage.getItem(key);
    return item ? JSON.parse(item) : (defaultValue ?? null);
  } catch {
    return defaultValue ?? null;
  }
}

export function setLocal(key: string, value: unknown): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error saving to localStorage key "${key}":`, error);
  }
}

export function removeLocal(key: string): void {
  try {
    window.localStorage.removeItem(key);
  } catch (error) {
    console.error(`Error removing localStorage key "${key}":`, error);
  }
}

export function getSession<T>(key: string, defaultValue?: T): T | null {
  try {
    const item = window.sessionStorage.getItem(key);
    return item ? JSON.parse(item) : (defaultValue ?? null);
  } catch {
    return defaultValue ?? null;
  }
}

export function setSession(key: string, value: unknown): void {
  try {
    window.sessionStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error saving to sessionStorage key "${key}":`, error);
  }
}

export function removeSession(key: string): void {
  try {
    window.sessionStorage.removeItem(key);
  } catch (error) {
    console.error(`Error removing sessionStorage key "${key}":`, error);
  }
}

export function clearAuth(): void {
  removeLocal("supabase.auth.token");
}
