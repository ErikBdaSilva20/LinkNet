import { useMemo } from "react";

interface AnimatedBackgroundProps {
  showGrid?: boolean;
  showOrbs?: boolean;
  showParticles?: boolean;
  className?: string;
}

export function AnimatedBackground({
  showGrid = true,
  showOrbs = true,
  showParticles = true,
  className = "",
}: AnimatedBackgroundProps) {
  const particles = useMemo(() => {
    return Array.from({ length: 20 }, (_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      delay: `${Math.random() * 5}s`,
      duration: `${4 + Math.random() * 4}s`,
    }));
  }, []);

  return (
    <div className={`fixed inset-0 overflow-hidden pointer-events-none ${className}`}>
      {/* Base gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-muted/20" />

      {/* Tech Grid */}
      {showGrid && (
        <div className="absolute inset-0 tech-grid opacity-10" />
      )}

      {/* Floating Orbs */}
      {showOrbs && (
        <>
          <div
            className="absolute w-96 h-96 rounded-full blur-3xl animate-orb-float"
            style={{
              background: "radial-gradient(circle, hsl(187 79% 53% / 0.15) 0%, transparent 70%)",
              top: "10%",
              left: "10%",
            }}
          />
          <div
            className="absolute w-80 h-80 rounded-full blur-3xl animate-orb-float"
            style={{
              background: "radial-gradient(circle, hsl(168 76% 40% / 0.12) 0%, transparent 70%)",
              bottom: "20%",
              right: "10%",
              animationDelay: "-7s",
            }}
          />
          <div
            className="absolute w-64 h-64 rounded-full blur-3xl animate-orb-float"
            style={{
              background: "radial-gradient(circle, hsl(187 79% 53% / 0.1) 0%, transparent 70%)",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              animationDelay: "-14s",
            }}
          />
        </>
      )}

      {/* Floating Particles */}
      {showParticles && (
        <div className="absolute inset-0">
          {particles.map((particle) => (
            <div
              key={particle.id}
              className="absolute w-1 h-1 rounded-full bg-primary/30 animate-float"
              style={{
                left: particle.left,
                top: particle.top,
                animationDelay: particle.delay,
                animationDuration: particle.duration,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
