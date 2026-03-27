import { useState, useEffect } from "react";
import { Clock } from "lucide-react";

interface SoldCountdownProps {
  soldAt: string;
}

export default function SoldCountdown({ soldAt }: SoldCountdownProps) {
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    const update = () => {
      const sold = new Date(soldAt).getTime();
      const expiry = sold + 24 * 60 * 60 * 1000;
      const now = Date.now();
      const diff = expiry - now;
      if (diff <= 0) {
        setTimeLeft("Removendo...");
        return;
      }
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      setTimeLeft(`${hours}h ${minutes}min`);
    };
    update();
    const interval = setInterval(update, 60000);
    return () => clearInterval(interval);
  }, [soldAt]);

  return (
    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/70 backdrop-blur-sm text-white text-xs font-medium">
      <Clock size={12} />
      <span>Será removido em {timeLeft}</span>
    </div>
  );
}
