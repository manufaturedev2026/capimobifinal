/**
 * Retorna a melhor URL de imagem pra usar em CARDS/listagens.
 * Prioriza thumbnail_url (~30KB) sobre photos[0] (pode ter ~400KB).
 *
 * Use em vitrines, busca, página inicial — qualquer lugar com muitos cards.
 * Para a página de detalhe, use photos diretamente (HD).
 */
export function getCardImage(item: {
  thumbnail_url?: string | null;
  photos?: string[] | null;
}): string | undefined {
  if (item.thumbnail_url) return item.thumbnail_url;
  return item.photos?.[0];
}
