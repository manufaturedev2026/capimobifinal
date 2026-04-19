/**
 * Build a SEO-friendly product URL using slug when available, falling back to ID.
 * - corretorSlug: team-member mirror store (?corretor=slug)
 * - lojaSlug: when item is shown on a partner's store (imported via partnership),
 *   uses path-style /loja/{slug} so each partner has their own shareable URL.
 */
export function productUrl(
  product: { id: string; slug?: string | null; _isPartnerImport?: boolean },
  corretorSlug?: string | null,
  lojaSlug?: string | null,
): string {
  const identifier = product.slug || product.id;
  const partnerSegment = product._isPartnerImport && lojaSlug ? `/loja/${lojaSlug}` : "";
  const base = `/imoveis/produto/${identifier}${partnerSegment}`;
  const params = new URLSearchParams();
  if (corretorSlug) params.set("corretor", corretorSlug);
  const qs = params.toString();
  return qs ? `${base}?${qs}` : base;
}

/** Build product link with optional partner store slug suffix appended to existing template. */
export function buildProductLink(
  product: { id: string; slug?: string | null; _isPartnerImport?: boolean },
  corretorSlug?: string | null,
  lojaSlug?: string | null,
): string {
  return productUrl(product, corretorSlug, lojaSlug);
}
