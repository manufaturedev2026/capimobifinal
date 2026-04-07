/**
 * Build a SEO-friendly product URL using slug when available, falling back to ID.
 */
export function productUrl(product: { id: string; slug?: string | null }, corretorSlug?: string | null): string {
  const identifier = product.slug || product.id;
  const base = `/imoveis/produto/${identifier}`;
  return corretorSlug ? `${base}?corretor=${corretorSlug}` : base;
}
