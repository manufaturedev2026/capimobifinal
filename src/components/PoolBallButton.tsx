import { useEffect, useRef, useState, ReactNode, CSSProperties } from "react";
import { motion, useMotionValue, useAnimationFrame, PanInfo } from "framer-motion";
import { useIsMobile } from "@/hooks/use-mobile";

interface PoolBallButtonProps {
  /** Initial bottom offset in px (mobile only). */
  initialBottom: number;
  /** Initial right offset in px (mobile only). */
  initialRight?: number;
  /** Button diameter in px on mobile. */
  size?: number;
  className?: string;
  style?: CSSProperties;
  ariaLabel?: string;
  onClick?: () => void;
  href?: string;
  target?: string;
  rel?: string;
  children: ReactNode;
  /** Initial entrance delay (seconds). */
  delay?: number;
}

/**
 * Floating button with billiard-style physics on mobile:
 * - Drag to move
 * - Fling to bounce off screen edges with friction
 * - Tap (no drag) triggers onClick / link
 * On desktop (≥768px) it stays fixed at the provided position.
 */
export function PoolBallButton({
  initialBottom,
  initialRight = 16,
  size = 44,
  className = "",
  style,
  ariaLabel,
  onClick,
  href,
  target,
  rel,
  children,
  delay = 0,
}: PoolBallButtonProps) {
  const isMobile = useIsMobile();
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const velocityRef = useRef({ vx: 0, vy: 0 });
  const draggingRef = useRef(false);
  const tapStartRef = useRef<{ x: number; y: number; t: number } | null>(null);
  const [bounds, setBounds] = useState({ minX: 0, maxX: 0, minY: 0, maxY: 0 });

  // Compute bounds relative to the initial fixed position (right/bottom anchor).
  useEffect(() => {
    if (!isMobile) return;
    const compute = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      // Button anchored at right=initialRight, bottom=initialBottom.
      // Translate space: x=0 keeps it at anchor. Negative x moves left, positive moves right (off-screen).
      // Allow it to go from left edge (x = -(w - size - initialRight)) to right edge (x = initialRight).
      const maxX = initialRight; // can stick to right edge (a few px off)
      const minX = -(w - size - initialRight);
      // y=0 at anchor. Negative y moves up, positive moves down (off-screen).
      const maxY = initialBottom; // can stick to bottom edge
      const minY = -(h - size - initialBottom);
      setBounds({ minX, maxX, minY, maxY });
    };
    compute();
    window.addEventListener("resize", compute);
    return () => window.removeEventListener("resize", compute);
  }, [isMobile, initialBottom, initialRight, size]);

  // Physics loop: apply velocity + bounce off bounds.
  useAnimationFrame((_, delta) => {
    if (!isMobile) return;
    if (draggingRef.current) return;
    const { vx, vy } = velocityRef.current;
    if (Math.abs(vx) < 0.02 && Math.abs(vy) < 0.02) return;

    const dt = Math.min(delta, 32) / 1000;
    let nx = x.get() + vx * dt;
    let ny = y.get() + vy * dt;
    let nvx = vx;
    let nvy = vy;

    const restitution = 0.72; // bounce energy retention
    const friction = 0.985; // air drag per frame

    if (nx < bounds.minX) {
      nx = bounds.minX;
      nvx = -nvx * restitution;
    } else if (nx > bounds.maxX) {
      nx = bounds.maxX;
      nvx = -nvx * restitution;
    }
    if (ny < bounds.minY) {
      ny = bounds.minY;
      nvy = -nvy * restitution;
    } else if (ny > bounds.maxY) {
      ny = bounds.maxY;
      nvy = -nvy * restitution;
    }

    nvx *= friction;
    nvy *= friction;

    if (Math.abs(nvx) < 4) nvx = 0;
    if (Math.abs(nvy) < 4) nvy = 0;

    velocityRef.current = { vx: nvx, vy: nvy };
    x.set(nx);
    y.set(ny);
  });

  const handleDragStart = () => {
    draggingRef.current = true;
    velocityRef.current = { vx: 0, vy: 0 };
  };

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    draggingRef.current = false;
    velocityRef.current = {
      vx: info.velocity.x,
      vy: info.velocity.y,
    };
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    tapStartRef.current = { x: e.clientX, y: e.clientY, t: Date.now() };
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    const start = tapStartRef.current;
    tapStartRef.current = null;
    if (!start) return;
    const dx = e.clientX - start.x;
    const dy = e.clientY - start.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const dur = Date.now() - start.t;
    // Treat as tap if moved <8px and released quickly
    if (dist < 8 && dur < 500) {
      if (href) {
        window.open(href, target || "_self", rel ? `noopener,noreferrer` : undefined);
      } else if (onClick) {
        onClick();
      }
    }
  };

  // On desktop, render a simple fixed button without physics.
  if (!isMobile) {
    if (href) {
      return (
        <motion.a
          href={href}
          target={target}
          rel={rel}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay, type: "spring", stiffness: 200 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          className={className}
          style={style}
          aria-label={ariaLabel}
        >
          {children}
        </motion.a>
      );
    }
    return (
      <motion.button
        type="button"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay, type: "spring", stiffness: 200 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={onClick}
        className={className}
        style={style}
        aria-label={ariaLabel}
      >
        {children}
      </motion.button>
    );
  }

  // Mobile: draggable with physics
  return (
    <motion.div
      drag
      dragMomentum={false}
      dragElastic={0}
      dragConstraints={{ left: bounds.minX, right: bounds.maxX, top: bounds.minY, bottom: bounds.maxY }}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      style={{ x, y, ...style, touchAction: "none" }}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay, type: "spring", stiffness: 200 }}
      whileTap={{ scale: 0.95 }}
      className={className}
      role={href ? "link" : "button"}
      aria-label={ariaLabel}
    >
      {children}
    </motion.div>
  );
}
