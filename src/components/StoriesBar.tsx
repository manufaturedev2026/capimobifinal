import { useState } from "react";
import { useStories, type SellerWithStories } from "@/hooks/useStories";
import StoryViewer from "@/components/StoryViewer";
import { Plus } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface StoriesBarProps {
  onAddStory?: () => void;
  textColor?: string;
  sellerId?: string;
  corretorSlug?: string | null;
}

export default function StoriesBar({ onAddStory, textColor, sellerId, corretorSlug }: StoriesBarProps) {
  const { sellerStories, loading } = useStories(sellerId);
  const { user } = useAuth();
  const [viewerOpen, setViewerOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  if (loading) return null;

  const handleOpen = (index: number) => {
    setSelectedIndex(index);
    setViewerOpen(true);
  };

  return (
    <>
      <div className="w-full overflow-x-auto py-4 px-4 md:px-8 scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        <div className="flex gap-4 items-center">
          {/* Add story button for logged-in users */}
          {user && onAddStory && (
            <button
              onClick={onAddStory}
              className="flex flex-col items-center gap-1.5 shrink-0"
            >
              <div className="w-16 h-16 md:w-[72px] md:h-[72px] rounded-full border-2 border-dashed flex items-center justify-center transition-colors" style={{ borderColor: textColor || undefined }}>
                <Plus className="w-6 h-6" style={{ color: textColor || undefined }} />
              </div>
              <span className="text-[11px] font-medium truncate max-w-[72px]" style={textColor ? { color: textColor } : undefined}>Publicar</span>
            </button>
          )}

          {sellerStories.map((seller, i) => (
            <button
              key={`${seller.stories[0]?.id || seller.sellerId}-${i}`}
              onClick={() => handleOpen(i)}
              className="flex flex-col items-center gap-1.5 shrink-0 group"
            >
              <div className="w-16 h-16 md:w-[72px] md:h-[72px] rounded-full p-[3px] bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600">
                <div className="w-full h-full rounded-full bg-background p-[2px]">
                  <img
                    src={seller.stories[0]?.image_url || seller.sellerLogo || ""}
                    alt={seller.sellerName}
                    className="w-full h-full rounded-full object-cover"
                    onError={(e) => {
                      const target = e.currentTarget;
                      if (seller.sellerLogo && target.src !== seller.sellerLogo) {
                        target.src = seller.sellerLogo;
                      } else {
                        target.style.display = "none";
                        target.parentElement!.classList.add("bg-muted", "flex", "items-center", "justify-center");
                        target.parentElement!.innerHTML = `<span class="text-sm font-bold text-muted-foreground">${seller.sellerName.charAt(0)}</span>`;
                      }
                    }}
                  />
                </div>
              </div>
              <span className="text-[11px] font-semibold truncate max-w-[72px]" style={textColor ? { color: textColor } : undefined}>
                {seller.sellerName.split(" ")[0]}
              </span>
            </button>
          ))}
        </div>
      </div>

      {viewerOpen && sellerStories.length > 0 && (
        <StoryViewer
          sellers={sellerStories}
          initialSellerIndex={selectedIndex}
          onClose={() => setViewerOpen(false)}
          corretorSlug={corretorSlug}
        />
      )}
    </>
  );
}
