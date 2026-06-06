import type { ReactNode } from "react";

type InlineMessageProps = {
  type: "info" | "success" | "warning" | "error";
  children: ReactNode;
  className?: string;
};

const messageStyles: Record<InlineMessageProps["type"], string> = {
  info: "bg-[#6FB6FF]",
  success: "bg-[#8BCF3F]",
  warning: "bg-[#FFD7BF]",
  error: "bg-[#FFD7BF]",
};

export function InlineMessage({
  type,
  children,
  className = "",
}: InlineMessageProps) {
  return (
    <p
      role={type === "error" || type === "warning" ? "alert" : "status"}
      className={`animate-panel-enter border-2 border-[#1A1A1A] px-4 py-3 text-sm font-black ${messageStyles[type]} ${className}`}
    >
      {children}
    </p>
  );
}
