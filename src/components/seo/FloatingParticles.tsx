import { motion } from "framer-motion";

export default function FloatingParticles({ color }: { color: string }) {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {Array.from({ length: 15 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            width: Math.random() * 4 + 2, height: Math.random() * 4 + 2,
            background: color, opacity: 0.15 + Math.random() * 0.2,
            left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%`,
          }}
          animate={{ y: [0, -40 - Math.random() * 60, 0], x: [0, (Math.random() - 0.5) * 30, 0], opacity: [0.1, 0.35, 0.1] }}
          transition={{ duration: 4 + Math.random() * 4, repeat: Infinity, delay: Math.random() * 3, ease: "easeInOut" }}
        />
      ))}
    </div>
  );
}
