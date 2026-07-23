import { forwardRef, ReactNode, CSSProperties, HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface GlassCardProps extends Pick<HTMLAttributes<HTMLDivElement>, 'draggable' | 'onDragStart' | 'onDragOver' | 'onDragLeave' | 'onDrop' | 'onDragEnd'> {
  children: ReactNode;
  className?: string;
  showOverlay?: boolean;
  hover?: boolean;
  style?: CSSProperties;
}

export const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(
  ({
    children,
    className = "",
    showOverlay = true,
    hover = false,
    style,
    draggable,
    onDragStart,
    onDragOver,
    onDragLeave,
    onDrop,
    onDragEnd,
  }, ref) => {
    return (
      <div
        ref={ref}
        style={style}
        draggable={draggable}
        onDragStart={onDragStart}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onDragEnd={onDragEnd}
        className={cn(
          "glass-card",
          hover && "hover-scale cursor-pointer",
          className
        )}
      >
        {showOverlay && <div className="glass-card-overlay" />}
        <div className="relative z-10">{children}</div>
      </div>
    );
  }
);

GlassCard.displayName = "GlassCard";
