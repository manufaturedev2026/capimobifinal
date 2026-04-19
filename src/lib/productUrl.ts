/**
 * Build a SEO-friendly product URL using slug when available, falling back to ID.
 * - corretorSlug: team-member mirror store
 * - lojaSlug: when item is shown on a partner's store (imported via partnership),
 *   forces ProductDetail to render the partner profile as the seller.
 */
export function productUrl(
  product: { id: string; slug?: string | null; _isPartnerImport?: boolean },
  corretorSlug?: string | null,
  lojaSlug?: string | null,
): string {
  const identifier = product.slug || product.id;
  const params = new URLSearchParams();
  if (corretorSlug) params.set("corretor", corretorSlug);
  if (product._isPartnerImport && lojaSlug) params.set("loja", lojaSlug);
  const qs = params.toString();
  return qs ? `/imoveis/produto/${identifier}?${qs}` : `/imoveis/produto/${identifier}`;
}

/** Build product link with optional partner store slug suffix appended to existing template. */
export function buildProductLink(
  product: { id: string; slug?: string | null; _isPartnerImport?: boolean },
  corretorSlug?: string | null,
  lojaSlug?: string | null,
): string {
  return productUrl(product, corretorSlug, lojaSlug);
}
