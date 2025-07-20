import { StandardFeature } from '@/modules/feature-flag';
import { FeatureFlag } from '@/modules/feature-flag/feature-flags';

// auto-logout flag will cause the client to log out first thing on page load, and remove the flag
type Key =
  | FeatureFlag
  | StandardFeature
  | 'locale'
  | 'cid'
  | 'auto-logout'
  | 'provider-dashboard-view-type'
  | 'provider-dashboard-view-type-v2'
  | 'pii-hidden';

export function get(key: Key): string | null {
  try {
    if (typeof window === 'undefined') return null;
    const value = localStorage.getItem(key);
    return value;
  } catch (e) {
    return null;
  }
}

export function set(key: Key, value: string): void {
  try {
    if (typeof window === 'undefined') return;
    localStorage.setItem(key, value);
  } catch (e) {}
}

export function remove(key: Key): void {
  try {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(key);
  } catch (e) {}
}

export function removeToken() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('token');
}

const LocalStorageHelpers = { set, removeToken, get, remove };

export default LocalStorageHelpers;
