/**
 * Returns the store URL path for a seller profile.
 * Uses slug when available, falls back to UUID.
 */
export function getStoreUrl(profile: { id: string; slug?: string | null; seller_type?: string }): string {
  const identifier = profile.slug || profile.id;
  return `/empresa/${identifier}`;
}

/**
 * Returns the full store URL (with origin) for a seller profile.
 */
export function getStoreFullUrl(profile: { id: string; slug?: string | null; seller_type?: string }): string {
  return `${window.location.origin}${getStoreUrl(profile)}`;
}
