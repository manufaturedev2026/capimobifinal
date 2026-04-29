import { supabase } from "@/integrations/supabase/client";

/**
 * In-memory + sessionStorage cache for platform_settings.
 * Reduces DB hits drastically since these values rarely change.
 * TTL: 10 minutes per key.
 */

const TTL_MS = 10 * 60 * 1000;
const STORAGE_PREFIX = "ps_cache_";

interface CacheEntry {
  value: any;
  expiresAt: number;
}

const memoryCache = new Map<string, CacheEntry>();
const inFlight = new Map<string, Promise<any>>();

function readFromStorage(key: string): CacheEntry | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_PREFIX + key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CacheEntry;
    if (Date.now() > parsed.expiresAt) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeToStorage(key: string, entry: CacheEntry) {
  try {
    sessionStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(entry));
  } catch {
    // ignore quota errors
  }
}

export async function getPlatformSetting<T = any>(key: string): Promise<T | null> {
  // 1. Memory cache
  const mem = memoryCache.get(key);
  if (mem && Date.now() < mem.expiresAt) {
    return mem.value as T;
  }

  // 2. Session storage
  const stored = readFromStorage(key);
  if (stored) {
    memoryCache.set(key, stored);
    return stored.value as T;
  }

  // 3. Deduplicate concurrent requests
  if (inFlight.has(key)) {
    return inFlight.get(key)!;
  }

  const promise = (async () => {
    try {
      const { data } = await supabase
        .from("platform_settings")
        .select("value")
        .eq("key", key)
        .maybeSingle();
      const value = (data?.value ?? null) as T;
      const entry: CacheEntry = { value, expiresAt: Date.now() + TTL_MS };
      memoryCache.set(key, entry);
      writeToStorage(key, entry);
      return value;
    } finally {
      inFlight.delete(key);
    }
  })();

  inFlight.set(key, promise);
  return promise;
}

export function invalidatePlatformSetting(key: string) {
  memoryCache.delete(key);
  try {
    sessionStorage.removeItem(STORAGE_PREFIX + key);
  } catch {
    // ignore
  }
}

export function invalidateAllPlatformSettings() {
  memoryCache.clear();
  try {
    Object.keys(sessionStorage)
      .filter((k) => k.startsWith(STORAGE_PREFIX))
      .forEach((k) => sessionStorage.removeItem(k));
  } catch {
    // ignore
  }
}
