/** localStorage access that never throws (sandboxed iframes, private mode, blocked storage). */
export function readStorage(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function writeStorage(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Blocked storage: the value is not kept for the next visit, nothing else breaks.
  }
}
