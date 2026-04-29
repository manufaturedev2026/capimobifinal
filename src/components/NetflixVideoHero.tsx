import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, X, Volume2, VolumeX } from "lucide-react";

function extractYouTubeId(url: string): string | null {
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([a-zA-Z0-9_-]{11})/);
  return match ? match[1] : null;
}

interface NetflixVideoHeroProps {
  videoUrl: string;
  storeName: string;
  storeLogo?: string;
  description?: string;
}

export default function NetflixVideoHero({ videoUrl, storeName, storeLogo, description }: NetflixVideoHeroProps) {
  const [open, setOpen] = useState(false);
  const [muted, setMuted] = useState(true);
  const videoId = extractYouTubeId(videoUrl);

  if (!videoId) return null;

  const thumbnail = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;

  return (
    <>
      {/* Hero Banner Card */}
      <section className="relative w-full overflow-hidden rounded-2xl border border-border bg-black group cursor-pointer"
        onClick={() => setOpen(true)}
      >
        {/* Thumbnail with Ken Burns */}
        <div className="relative aspect-[21/9] md:aspect-[21/9] overflow-hidden">
          <motion.img
            src={thumbnail}
            alt={storeName}
            className="absolute inset-0 w-full h-full object-cover"
            initial={{ scale: 1.05 }}
            animate={{ scale: 1 }}
            transition={{ duration: 8, ease: "easeOut" }}
          />

          {/* Gradient overlays */}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-transparent to-transparent" />

          {/* Play button center */}
          <motion.div
            className="absolute inset-0 flex items-center justify-center z-10"
            initial={{ opacity: 0.7 }}
            whileHover={{ opacity: 1 }}
          >
            <motion.div
              className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center group-hover:bg-white/30 transition-colors"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <Play size={28} className="text-white ml-1" fill="white" />
            </motion.div>
          </motion.div>

          {/* Bottom info */}
          <div className="absolute bottom-0 left-0 right-0 p-4 md:p-8 z-10">
            <div className="flex items-end gap-4">
              {storeLogo && (
                <img loading="lazy" decoding="async"
                  src={storeLogo}
                  alt={storeName}
                  className="w-12 h-12 md:w-16 md:h-16 rounded-xl object-cover border-2 border-white/20 shadow-2xl flex-shrink-0"
                />
              )}
              <div className="flex-1 min-w-0">
                <motion.p
                  className="text-[10px] md:text-xs font-bold text-red-500 uppercase tracking-widest mb-1"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  ▶ Lançamento
                </motion.p>
                <motion.h2
                  className="font-display font-bold text-xl md:text-3xl text-white leading-tight truncate"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  {storeName}
                </motion.h2>
                {description && (
                  <motion.p
                    className="text-white/60 text-xs md:text-sm mt-1 line-clamp-2 max-w-lg"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                  >
                    {description}
                  </motion.p>
                )}
              </div>
            </div>
          </div>

          {/* Top-right "Assistir" pill */}
          <motion.div
            className="absolute top-4 right-4 z-10"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <span className="px-3 py-1.5 rounded-full bg-red-600 text-white text-[10px] md:text-xs font-bold shadow-lg flex items-center gap-1.5">
              <Play size={12} fill="white" /> Assistir
            </span>
          </motion.div>
        </div>
      </section>

      {/* Fullscreen Netflix-style Modal */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[200] bg-black flex flex-col"
            onClick={() => setOpen(false)}
          >
            {/* Top bar */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between p-4 md:p-6 bg-gradient-to-b from-black/80 to-transparent"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3">
                {storeLogo && (
                  <img loading="lazy" decoding="async" src={storeLogo} alt="" className="w-8 h-8 rounded-lg object-cover border border-white/20" />
                )}
                <div>
                  <p className="text-white font-display font-bold text-sm md:text-base">{storeName}</p>
                  <p className="text-white/50 text-[10px]">Apresentação exclusiva</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setMuted(!muted)}
                  className="w-9 h-9 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/20 transition-colors"
                >
                  {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                </button>
                <button
                  onClick={() => setOpen(false)}
                  className="w-9 h-9 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/20 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
            </motion.div>

            {/* Video */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: "spring", damping: 30, stiffness: 200 }}
              className="flex-1 flex items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-full h-full max-w-[100vw] max-h-[100vh]">
                <iframe
                  src={`https://www.youtube.com/embed/${videoId}?autoplay=1&mute=${muted ? 1 : 0}&rel=0&modestbranding=1&showinfo=0&controls=1`}
                  title="Vídeo"
                  allow="autoplay; encrypted-media; fullscreen"
                  allowFullScreen
                  className="w-full h-full"
                />
              </div>
            </motion.div>

            {/* Bottom info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="absolute bottom-0 left-0 right-0 z-50 p-4 md:p-6 bg-gradient-to-t from-black/90 to-transparent"
              onClick={(e) => e.stopPropagation()}
            >
              {description && (
                <p className="text-white/50 text-xs md:text-sm max-w-xl line-clamp-2">{description}</p>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
