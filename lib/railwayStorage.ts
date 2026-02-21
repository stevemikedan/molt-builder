const RAILWAY_KEY = 'molt_railway_v1';

export function getRailwayToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem(RAILWAY_KEY);
  } catch {
    return null;
  }
}

export function setRailwayToken(token: string): void {
  if (typeof window === 'undefined') return;
  if (token) {
    localStorage.setItem(RAILWAY_KEY, token);
  } else {
    localStorage.removeItem(RAILWAY_KEY);
  }
}
