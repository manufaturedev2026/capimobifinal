import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useGlobalStories, type GlobalStory } from "@/hooks/useGlobalStories";
import { Sparkles } from "lucide-react";

interface GlobalStoriesBarProps {
  primaryColor?: string;
  textColor?: string;
  city?: string;
}

export default function GlobalStoriesBar({ primaryColor = "#3B82F6", textColor = "#fff", city }: GlobalStoriesBarProps) {
  const { stories, loading } = useGlobalStories(city);
  const navigate = useNavigate();
  const [viewStory, setViewStory] = useState<GlobalStory | null>(null);

  if (loading || stories.length === 0) return null;

  return (
    <>
      <div className="w-full py-4 px-4 md:px-8">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles size={14} style={{ color: primaryColor }} />
          <span className="text-xs font-bold uppercase tracking-wider" style={{ color: textColor, opacity: 0.7 }}>
            Novidades dos Corretores
          </span>
        </div>
        <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-1" style={{ scrollbarWidth: "none" }}>
          {stories.map((story) => (
            <button
              key={story.id}
              onClick={() => setViewStory(story)}
              className="flex flex-col items-center gap-1.5 shrink-0 group"
            >
              <div
                className="w-16 h-16 md:w-[72px] md:h-[72px] rounded-full p-[3px]"
                style={{
                  background: `linear-gradient(135deg, ${primaryColor}, #f59e0b, ${primaryColor})`,
                }}
              >
                <div className="w-full h-full rounded-full bg-black/80 p-[2px]">
                  <img loading="lazy" decoding="async"
                    src={story.image_url}
                    alt={story.title || story.sellerName}
                    className="w-full h-full rounded-full object-cover"
                    onError={(e) => {
                      const target = e.currentTarget;
                      if (story.sellerLogo && target.src !== story.sellerLogo) {
                        target.src = story.sellerLogo;
                      } else {
                        target.style.display = "none";
                        target.parentElement!.classList.add("flex", "items-center", "justify-center");
                        target.parentElement!.innerHTML = `<span class="text-sm font-bold" style="color:${textColor}">${story.sellerName.charAt(0)}</span>`;
                      }
                    }}
                  />
                </div>
              </div>
              <span
                className="text-[11px] font-semibold truncate max-w-[72px]"
                style={{ color: textColor }}
              >
                {story.sellerName.split(" ")[0]}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Full-screen story viewer */}
      {viewStory && (
        <div
          className="fixed inset-0 z-[9999] bg-black flex items-center justify-center"
          onClick={() => setViewStory(null)}
        >
          <div className="relative w-full h-full max-w-lg mx-auto" onClick={(e) => e.stopPropagation()}>
            <img loading="lazy" decoding="async"
              src={viewStory.image_url}
              alt={viewStory.title || ""}
              className="w-full h-full object-contain"
            />
            {/* Overlay info */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
              <div className="flex items-center gap-3 mb-3">
                {viewStory.sellerLogo && (
                  <img loading="lazy" decoding="async" src={viewStory.sellerLogo} className="w-8 h-8 rounded-full object-cover border border-white/30" alt="" />
                )}
                <span className="text-white text-sm font-semibold">{viewStory.sellerName}</span>
              </div>
              {viewStory.title && (
                <h3 className="text-white text-lg font-bold">{viewStory.title}</h3>
              )}
              {viewStory.description && (
                <p className="text-white/80 text-sm mt-1">{viewStory.description}</p>
              )}
              {(viewStory.button_url || viewStory.item_id) && (
                <button
                  onClick={() => {
                    setViewStory(null);
                    let url = viewStory.button_url || "";
                    const match = url.match(/^\/imovel\/(.+)/);
                    if (match) url = `/imoveis/produto/${match[1]}`;
                    else if (!url && viewStory.item_id) url = `/imoveis/produto/${viewStory.item_id}`;
                    navigate(url);
                  }}
                  className="mt-4 px-6 py-2.5 rounded-full text-sm font-bold text-black bg-white hover:bg-white/90 transition-colors"
                >
                  {viewStory.button_text || "Ver Imóvel"}
                </button>
              )}
            </div>
            {/* Close button */}
            <button
              onClick={() => setViewStory(null)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/50 flex items-center justify-center text-white hover:bg-black/70 transition-colors"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </>
  );
}
