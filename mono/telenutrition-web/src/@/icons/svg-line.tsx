import React from 'react';
import { cn } from "@/utils";

interface VerticalLineProps {
  className?: string;
  size?: number;
  width?: number | string;
  strokeWidth?: number | string;
  xOffset?: number;
}

export function VerticalLine({
  className,
  size = 12,
  width = 10,
  xOffset = 10 / 2,
  strokeWidth = 1,
}: VerticalLineProps) {
  return (
    <svg className={cn('stroke-black fill-black', className)} width={width} height={size} viewBox={`0 0 ${width} ${size}`}>
      <line
        x1={xOffset}
        x2={xOffset}
        y1={0}
        y2={size}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
    </svg>
  );
}
