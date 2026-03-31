import { useEffect, useRef } from "react";
import { QrCode } from "lucide-react";

interface QRCodeDisplayProps {
  url: string;
  size?: number;
}

export default function QRCodeDisplay({ url, size = 150 }: QRCodeDisplayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Use external QR API to render
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(url)}&format=png&margin=8`;
    img.onload = () => {
      canvas.width = size;
      canvas.height = size;
      ctx.drawImage(img, 0, 0, size, size);
    };
  }, [url, size]);

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="bg-white rounded-xl p-3 shadow-md border border-border">
        <canvas ref={canvasRef} width={size} height={size} className="rounded-lg" />
      </div>
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <QrCode size={14} />
        <span>Escaneie para ver o anúncio</span>
      </div>
    </div>
  );
}
