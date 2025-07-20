import React from 'react';
import { cn } from "@/utils";

interface SvgCircleProps {
  className?: string;
  size?: number;
  strokeWidth?: number;
}

export default function SvgCircle({
  className,
  size = 12,
  strokeWidth = 1,
}: SvgCircleProps) {
  return (
    <svg className={cn('stroke-black fill-black', className)} width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle
        cx={size / 2}
        cy={size / 2}
        r={size / 2 - strokeWidth / 2}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
