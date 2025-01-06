import { cn } from '@/lib/utils';

type DotProps = {
  size: number;
  delay: number;
};

function Dot({ size, delay }: DotProps) {
  return (
    <div
      className="rounded-full bg-muted-foreground/40 animate-bounce"
      style={{
        width: `${size}px`,
        height: `${size}px`,
        animationDelay: `${delay}ms`,
      }}
    />
  );
}

type TypingIndicatorProps = {
  /**
   * Size of each dot in pixels
   * @default 8
   */
  dotSize?: number;
  /**
   * Delay in milliseconds before the animation starts
   * @default 0
   */
  startDelay?: number;
  className?: string;
};

export function TypingIndicator({
  dotSize = 8,
  startDelay = 0,
  className,
}: TypingIndicatorProps) {
  return (
    <div className={cn('flex gap-1 items-center p-2', className)}>
      <Dot size={dotSize} delay={startDelay + 0} />
      <Dot size={dotSize} delay={startDelay + 333} />
      <Dot size={dotSize} delay={startDelay + 666} />
    </div>
  );
}
