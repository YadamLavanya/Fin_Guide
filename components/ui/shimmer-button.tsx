"use client";

import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes } from "react";

interface ShimmerButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  shimmerColor?: string;
  className?: string;
  children: React.ReactNode;
}

export const ShimmerButton = ({
  shimmerColor = "#ffffff",
  className,
  children,
  ...props
}: ShimmerButtonProps) => {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-lg py-3 px-6 overflow-hidden group/btn relative",
        className
      )}
      {...props}
    >
      <div className="relative z-10">{children}</div>
      <div
        className="absolute inset-0 z-0 transform -translate-x-full group-hover/btn:translate-x-0 transition-transform duration-700"
        style={{
          background: `linear-gradient(90deg, transparent 0%, ${shimmerColor}22 50%, transparent 100%)`,
        }}
      />
    </button>
  );
};
