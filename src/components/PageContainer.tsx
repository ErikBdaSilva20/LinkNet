import { ReactNode } from "react";
import { AnimatedBackground } from "./AnimatedBackground";

interface PageContainerProps {
  children: ReactNode;
  showBackground?: boolean;
  showGrid?: boolean;
  showOrbs?: boolean;
  showParticles?: boolean;
  className?: string;
}

export function PageContainer({
  children,
  showBackground = true,
  showGrid = true,
  showOrbs = true,
  showParticles = true,
  className = "",
}: PageContainerProps) {
  return (
    <div className={`min-h-screen relative ${className}`}>
      {showBackground && (
        <AnimatedBackground
          showGrid={showGrid}
          showOrbs={showOrbs}
          showParticles={showParticles}
        />
      )}
      <div className="relative z-10">{children}</div>
    </div>
  );
}
