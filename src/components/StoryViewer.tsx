import { useState, useEffect, useCallback } from "react";
import { X, ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import type { SellerWithStories } from "@/hooks/useStories";

interface StoryViewerProps {
  sellers: SellerWithStories[];
  initialSellerIndex: number;
  onClose: () => void;
  corretorSlug?: string | null;
}

const STORY_DURATION = 6000;

export default function StoryViewer({ sellers, initialSellerIndex, onClose, corretorSlug }: StoryViewerProps) {
  const [sellerIdx, setSellerIdx] = useState(initialSellerIndex);
  const [storyIdx, setStoryIdx] = useState(0);
  const [progress, setProgress] = useState(0);
  const [paused, setPaused] = useState(false);

  const currentSeller = sellers[sellerIdx];
  const currentStory = currentSeller?.stories[storyIdx];
  const totalStories = currentSeller?.stories.length ?? 0;

  const goNextStory = useCallback(() => {
    if (storyIdx < totalStories - 1) {
      setStoryIdx((p) => p + 1);
      setProgress(0);
    } else if (sellerIdx < sellers.length - 1) {
      setSellerIdx((p) => p + 1);
      setStoryIdx(0);
      setProgress(0);
    } else {
      onClose();
    }
  }, [storyIdx, totalStories, sellerIdx, sellers.length, onClose]);

  const goPrevStory = useCallback(() => {
    if (storyIdx > 0) {
      setStoryIdx((p) => p - 1);
      setProgress(0);
    } else if (sellerIdx > 0) {
      setSellerIdx((p) => p - 1);
      const prevSeller = sellers[sellerIdx - 1];
      setStoryIdx(prevSeller.stories.length - 1);
      setProgress(0);
    }
  }, [storyIdx, sellerIdx, sellers]);

  // Auto-advance
  useEffect(() => {
    if (paused) return;
    const interval = setInterval(() => {
      setProgress((p) => {
        const next = p + (100 / (STORY_DURATION / 50));
        if (next >= 100) {
          goNextStory();
          return 0;
        }
        return next;
      });
    }, 50);
    return () => clearInterval(interval);
  }, [paused, goNextStory]);

  useEffect(() => {
    setProgress(0);
  }, [sellerIdx, storyIdx]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") goNextStory();
      if (e.key === "ArrowLeft") goPrevStory();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose, goNextStory, goPrevStory]);

  if (!currentStory) return null;

  const timeAgo = (date: string) => {
    const mins = Math.floor((Date.now() - new Date(date).getTime()) / 60000);
    if (mins < 60) return `${mins}min`;
    return `${Math.floor(mins / 60)}h`;
  };

  const hasOverlay = currentStory.title || currentStory.description || currentStory.button_text;

  // Resolve CTA URL: button_url from DB uses /imovel/slug but route is /imoveis/produto/:id
  const resolveCtaUrl = () => {
    const withCorretorContext = (url: string) => {
      if (!corretorSlug) return url;
      const separator = url.includes("?") ? "&" : "?";
      return `${url}${separator}corretor=${encodeURIComponent(corretorSlug)}`;
    };

    if (currentStory.button_url) {
      // Convert /imovel/slug → /imoveis/produto/slug
      const match = currentStory.button_url.match(/^\/imovel\/(.+)/);
      if (match) return withCorretorContext(`/imoveis/produto/${match[1]}`);
      return withCorretorContext(currentStory.button_url);
    }
    if (currentStory.item_id) return withCorretorContext(`/imoveis/produto/${currentStory.item_id}`);
    return null;
  };
  const ctaUrl = resolveCtaUrl();

  return (
    <div className="fixed inset-0 z-[9999] bg-black/95 flex items-center justify-center">
      {/* Close */}
      <button onClick={onClose} className="absolute top-4 right-4 z-50 text-white/80 hover:text-white">
        <X className="w-7 h-7" />
      </button>

      {/* Nav arrows */}
      {(sellerIdx > 0 || storyIdx > 0) && (
        <button onClick={goPrevStory} className="absolute left-2 md:left-6 top-1/2 -translate-y-1/2 z-50 text-white/60 hover:text-white">
          <ChevronLeft className="w-8 h-8" />
        </button>
      )}
      <button onClick={goNextStory} className="absolute right-2 md:right-6 top-1/2 -translate-y-1/2 z-50 text-white/60 hover:text-white">
        <ChevronRight className="w-8 h-8" />
      </button>

      {/* Story container */}
      <div
        className="relative w-full max-w-[420px] h-full max-h-[90vh] md:max-h-[85vh] md:rounded-2xl overflow-hidden bg-black"
        onMouseDown={() => setPaused(true)}
        onMouseUp={() => setPaused(false)}
        onTouchStart={() => setPaused(true)}
        onTouchEnd={() => setPaused(false)}
      >
        {/* Progress bars */}
        <div className="absolute top-0 left-0 right-0 z-40 flex gap-1 p-2 pt-3">
          {Array.from({ length: totalStories }).map((_, i) => (
            <div key={i} className="flex-1 h-[3px] bg-white/30 rounded-full overflow-hidden">
              <div
                className="h-full bg-white rounded-full"
                style={{
                  width: `${i < storyIdx ? 100 : i === storyIdx ? progress : 0}%`,
                  transition: "none",
                }}
              />
            </div>
          ))}
        </div>

        {/* Header */}
        <div className="absolute top-6 left-0 right-0 z-40 flex items-center gap-3 px-4">
          <div className="w-9 h-9 rounded-full overflow-hidden bg-white/20 shrink-0 ring-2 ring-white/30">
            {currentSeller.sellerLogo ? (
              <img loading="lazy" decoding="async" src={currentSeller.sellerLogo} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white text-sm font-bold">
                {currentSeller.sellerName.charAt(0)}
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-semibold truncate drop-shadow">{currentSeller.sellerName}</p>
            <p className="text-white/60 text-xs">{timeAgo(currentStory.created_at)}</p>
          </div>
        </div>

        {/* Tap zones */}
        <div className="absolute inset-0 z-30 flex">
          <div className="w-1/3 h-full" onClick={goPrevStory} />
          <div className="w-1/3 h-full" />
          <div className="w-1/3 h-full" onClick={goNextStory} />
        </div>

        {/* Image */}
        <AnimatePresence mode="wait">
          <motion.img
            key={currentStory.id}
            src={currentStory.image_url}
            alt="Story"
            className="absolute inset-0 w-full h-full object-contain"
            initial={{ opacity: 0, scale: 1.02 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          />
        </AnimatePresence>

        {/* Bottom overlay: title, description, CTA button */}
        {hasOverlay && (
          <div className="absolute bottom-0 left-0 right-0 z-40 bg-gradient-to-t from-black/90 via-black/50 to-transparent pt-16 pb-6 px-5">
            {currentStory.title && (
              <h3 className="text-white font-bold text-lg leading-tight drop-shadow-lg">
                {currentStory.title}
              </h3>
            )}
            {currentStory.description && (
              <p className="text-white/85 text-sm mt-1.5 leading-snug drop-shadow">
                {currentStory.description}
              </p>
            )}
            {currentStory.button_text && ctaUrl && (
              <Link
                to={ctaUrl}
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-1.5 mt-3 px-5 py-2.5 bg-white text-gray-900 font-bold text-sm rounded-full shadow-xl hover:scale-105 transition-transform"
              >
                {currentStory.button_text}
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
