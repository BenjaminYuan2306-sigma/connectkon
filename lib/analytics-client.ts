'use client';
import { type UsageEventName } from './analytics-contract';
const preferenceKey = 'connectkon.usage.enabled',
  visitorKey = 'connectkon.usage.visitor',
  sessionKey = 'connectkon.usage.session';
let sentVisit: string | undefined;
export function usageEnabled() {
  if (typeof window === 'undefined') return false;
  try {
    return (
      navigator.doNotTrack !== '1' &&
      !(navigator as Navigator & { globalPrivacyControl?: boolean })
        .globalPrivacyControl &&
      localStorage.getItem(preferenceKey) !== 'false'
    );
  } catch {
    return false;
  }
}
export function setUsageEnabled(enabled: boolean) {
  try {
    localStorage.setItem(preferenceKey, String(enabled));
    if (!enabled) {
      localStorage.removeItem(visitorKey);
      sessionStorage.removeItem(sessionKey);
      sentVisit = undefined;
    } else trackUsage('visit');
  } catch {}
}
function read(key: string, storage: Storage) {
  try {
    return JSON.parse(storage.getItem(key) || 'null');
  } catch {
    return null;
  }
}
export function trackUsage(event: UsageEventName) {
  if (!usageEnabled()) return;
  try {
    const now = Date.now();
    let visitor = read(visitorKey, localStorage),
      session = read(sessionKey, sessionStorage);
    if (!visitor || typeof visitor.id !== 'string' || visitor.expires < now) {
      visitor = { id: crypto.randomUUID(), expires: now + 90 * 86400_000 };
      localStorage.setItem(visitorKey, JSON.stringify(visitor));
    }
    if (!session || typeof session.id !== 'string' || session.expires < now)
      session = { id: crypto.randomUUID() };
    session.expires = now + 30 * 60_000;
    sessionStorage.setItem(sessionKey, JSON.stringify(session));
    const send = (name: UsageEventName, id: string) => {
      void fetch('/api/analytics/event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, visitor: visitor.id, event: name }),
        keepalive: true,
      }).catch(() => {});
    };
    if (sentVisit !== session.id) {
      sentVisit = session.id;
      send('visit', session.id);
    }
    if (event !== 'visit') send(event, crypto.randomUUID());
  } catch {
    /* Analytics must never interfere with the local workspace. */
  }
}
