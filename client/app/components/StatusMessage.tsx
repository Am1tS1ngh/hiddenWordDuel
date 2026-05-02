"use client";

import { Zap, X, Clock, CheckCircle2, AlertCircle } from "lucide-react";

interface StatusMessageProps {
  message: string;
}

export default function StatusMessage({ message }: StatusMessageProps) {
  if (!message) return null;

  // Determine icon and styling based on message content
  let Icon = Zap;
  let iconColor = "text-indigo-500";
  let cleanMessage = message;

  if (message.includes("❌") || message.toLowerCase().includes("wrong")) {
    Icon = X;
    iconColor = "text-rose-500";
    cleanMessage = message.replace("❌ ", "").replace("❌", "");
  } else if (message.includes("🎉") || message.toLowerCase().includes("won")) {
    Icon = CheckCircle2;
    iconColor = "text-emerald-500";
    cleanMessage = message.replace("🎉 ", "").replace("🎉", "");
  } else if (message.toLowerCase().includes("waiting") || message.toLowerCase().includes("looking")) {
    Icon = Clock;
    iconColor = "text-amber-500";
  } else if (message.toLowerCase().includes("disconnected")) {
    Icon = AlertCircle;
    iconColor = "text-rose-500";
  }

  return (
    <div className="w-full max-w-md mx-auto mt-4 text-center py-2.5 px-5 rounded-full bg-white/60 border border-white/80 shadow-sm flex items-center justify-center gap-2 animate-fade-in-scale">
      <Icon className={`w-4 h-4 shrink-0 ${iconColor}`} />
      <p className="text-sm font-medium text-gray-700">{cleanMessage}</p>
    </div>
  );
}
