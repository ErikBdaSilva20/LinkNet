import { useRef, useCallback } from "react";
import { QRCodeCanvas, QRCodeSVG } from "qrcode.react";
import { Button } from "@/components/ui/button";
import { Image, FileCode } from "lucide-react";

interface QRCodeGeneratorProps {
  value: string;
  size?: number;
  label?: string;
}

export function QRCodeGenerator({ 
  value, 
  size = 200,
  label 
}: QRCodeGeneratorProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<HTMLDivElement>(null);
  
  // Download como PNG
  const downloadPNG = useCallback(() => {
    const canvas = canvasRef.current?.querySelector("canvas");
    if (!canvas) return;
    
    const pngUrl = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = pngUrl;
    link.download = `qrcode-${label || "link"}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [label]);
  
  // Download como SVG
  const downloadSVG = useCallback(() => {
    const svg = svgRef.current?.querySelector("svg");
    if (!svg) return;
    
    const svgData = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([svgData], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `qrcode-${label || "link"}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [label]);
  
  return (
    <div className="space-y-4">
      {/* Preview usando Canvas */}
      <div 
        ref={canvasRef} 
        className="bg-white p-4 rounded-xl inline-block"
      >
        <QRCodeCanvas 
          value={value} 
          size={size}
          level="H"
          includeMargin
        />
      </div>
      
      {/* SVG oculto para download */}
      <div ref={svgRef} className="hidden">
        <QRCodeSVG 
          value={value} 
          size={size}
          level="H"
          includeMargin
        />
      </div>
      
      {/* Botões de download */}
      <div className="flex gap-2">
        <Button onClick={downloadPNG} variant="outline" className="rounded-xl border-border/50">
          <Image className="h-4 w-4 mr-2" />
          PNG
        </Button>
        <Button onClick={downloadSVG} variant="outline" className="rounded-xl border-border/50">
          <FileCode className="h-4 w-4 mr-2" />
          SVG
        </Button>
      </div>
    </div>
  );
}
