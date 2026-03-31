import { useState, useEffect, useCallback } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { SellerWithStories } from "@/hooks/useStories";

interface StoryViewerProps {
  sellers: SellerWithStories[];
  initialSellerIndex: number;
  onClose: () => void;
}

const STORY_DURATION = 5000; // 5 seconds

export default function StoryViewer({ sellers, initialSellerIndex, onClose }: StoryViewerProps) {
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

  // Auto-advance timer
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

  // Reset progress on story change
  useEffect(() => {
    setProgress(0);
  }, [sellerIdx, storyIdx]);

  // Close on Escape
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

  return (
    <div className="fixed inset-0 z-[9999] bg-black flex items-center justify-center">
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-50 text-white/80 hover:text-white transition-colors"
      >
        <X className="w-7 h-7" />
      </button>

      {/* Previous seller nav */}
      {(sellerIdx > 0 || storyIdx > 0) && (
        <button
          onClick={goPrevStory}
          className="absolute left-2 md:left-6 top-1/2 -translate-y-1/2 z-50 text-white/60 hover:text-white transition-colors"
        >
          <ChevronLeft className="w-8 h-8" />
        </button>
      )}

      {/* Next seller nav */}
      <button
        onClick={goNextStory}
        className="absolute right-2 md:right-6 top-1/2 -translate-y-1/2 z-50 text-white/60 hover:text-white transition-colors"
      >
        <ChevronRight className="w-8 h-8" />
      </button>

      {/* Story content */}
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
                className="h-full bg-white rounded-full transition-none"
                style={{
                  width: `${i < storyIdx ? 100 : i === storyIdx ? progress : 0}%`,
                }}
              />
            </div>
          ))}
        </div>

        {/* Header */}
        <div className="absolute top-6 left-0 right-0 z-40 flex items-center gap-3 px-4">
          <div className="w-9 h-9 rounded-full overflow-hidden bg-white/20 shrink-0">
            {currentSeller.sellerLogo ? (
              <img src={currentSeller.sellerLogo} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white text-sm font-bold">
                {currentSeller.sellerName.charAt(0)}
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-semibold truncate">{currentSeller.sellerName}</p>
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
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          />
        </AnimatePresence>
      </div>
    </div>
  );
}
