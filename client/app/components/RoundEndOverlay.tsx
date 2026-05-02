import { Zap, Crown, Frown, Flag } from "lucide-react";
import { useEffect, useState } from "react";

interface RoundEndOverlayProps {
  statusMsg: string;
  revealedWord: string;
  countdown: number | null;
  maxCountdown?: number;
}

export const SplashIcon = ({ className = "", flipped = false, size = 28 }: { className?: string, flipped?: boolean, size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" className={className}>
    <g transform={flipped ? "translate(12 12) scale(-1 1) translate(-12 -12)" : undefined}>
      {/* Middle Petal: Thick base on left, narrow tip pointing towards text */}
      <g transform="translate(5 12) rotate(0)">
         <path d="M 0 -2.5 C 5 -2.5, 10 -0.8, 10 0 C 10 0.8, 5 2.5, 0 2.5 A 2.5 2.5 0 0 1 0 -2.5 Z" fill="currentColor" />
      </g>
      
      {/* Top Petal: Angled downwards towards the text */}
      <g transform="translate(6 5) rotate(23.6)">
         <path d="M 0 -1.8 C 4.5 -1.8, 8.7 -0.6, 8.7 0 C 8.7 0.6, 4.5 1.8, 0 1.8 A 1.8 1.8 0 0 1 0 -1.8 Z" fill="currentColor" />
      </g>
      
      {/* Bottom Petal: Angled upwards towards the text */}
      <g transform="translate(6 19) rotate(-23.6)">
         <path d="M 0 -1.8 C 4.5 -1.8, 8.7 -0.6, 8.7 0 C 8.7 0.6, 4.5 1.8, 0 1.8 A 1.8 1.8 0 0 1 0 -1.8 Z" fill="currentColor" />
      </g>
    </g>
  </svg>
);

export default function RoundEndOverlay({
  statusMsg,
  revealedWord,
  countdown,
  maxCountdown = 5,
}: RoundEndOverlayProps) {
  // Determine status from message
  const isDraw = statusMsg.toLowerCase().includes("draw");
  const isWin = statusMsg.toLowerCase().includes("won") && statusMsg.toLowerCase().includes("you");
  const isLose = !isWin && !isDraw;
  
  const title = isDraw ? "Draw!" : isWin ? "Victory!" : "Defeat";
  const subtitle = isDraw 
    ? "No one scores this round." 
    : isWin 
    ? "You scored a point!" 
    : "Your opponent scored.";

  const tipText = isDraw
    ? "Even the best get it tough sometimes! Next round is yours 💪"
    : isWin
    ? "Great job spotting that quickly! Keep up the momentum 🔥"
    : "Don't worry, stay focused! You'll get the next one ⚡";

  // Dynamic Styles based on status
  const iconColorClass = isWin ? "text-amber-500" : isLose ? "text-rose-500" : "text-gray-500";
  const iconBgClass = isWin ? "bg-amber-50" : isLose ? "bg-rose-50" : "bg-gray-50";

  // Circular progress calculation
  const safeCountdown = countdown !== null ? countdown : 0;
  const progress = safeCountdown / maxCountdown;
  const circleRadius = 36;
  const circumference = 2 * Math.PI * circleRadius;
  const strokeDashoffset = circumference - progress * circumference;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1a1736]/20 backdrop-blur-sm overflow-hidden font-sans">
      
      {/* Decorative floating letters (bg) */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
        {/* We reuse the aesthetic of scattered letters from the image */}
        <div className="absolute top-[20%] left-[25%] w-12 h-12 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white/50 text-xl font-bold -rotate-12">P</div>
        <div className="absolute top-[15%] right-[25%] w-10 h-10 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white/50 text-lg font-bold rotate-12">A</div>
        <div className="absolute bottom-[25%] left-[20%] w-14 h-14 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white/50 text-2xl font-bold -rotate-6">E</div>
        <div className="absolute bottom-[20%] right-[20%] w-12 h-12 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white/50 text-xl font-bold rotate-12">L</div>
        {/* Connecting swoosh lines (SVG) */}
        <svg className="absolute inset-0 w-full h-full opacity-30" pointerEvents="none">
           <path d="M 350 250 Q 500 150 700 250" fill="transparent" stroke="white" strokeWidth="1" strokeDasharray="4 4" />
           <path d="M 300 600 Q 500 700 750 550" fill="transparent" stroke="white" strokeWidth="1" strokeDasharray="4 4" />
        </svg>
      </div>

      {/* Drop-shadow wrapper for unified shape */}
      <div className="relative w-full max-w-[380px] mx-4 drop-shadow-[0_20px_50px_rgba(0,0,0,0.2)] animate-fade-in-scale">
        
        {/* Main Card */}
        <div className="relative flex flex-col items-center bg-white rounded-[2rem] p-8 pt-12">
          
          {/* Top Bump (unified with card) */}
          <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-20 h-20 bg-white rounded-full" />
          
          {/* Inner Colored Circle */}
          <div className="absolute -top-6 left-1/2 -translate-x-1/2 flex items-center justify-center">
             <div className={`w-12 h-12 rounded-full flex items-center justify-center ${iconBgClass} ${iconColorClass} shadow-[inset_0_2px_12px_rgba(0,0,0,0.08)]`}>
                {isWin && <Crown size={24} strokeWidth={2.5} />}
                {isLose && <Frown size={24} strokeWidth={2.5} />}
                {isDraw && <Flag size={24} strokeWidth={2.5} />}
             </div>
          </div>

          {/* Title Section */}
          <div className="relative z-10 flex items-center gap-3 mt-2">
           <SplashIcon className="text-indigo-300" size={28} />
           <h2 className="text-3xl font-extrabold text-[#2d2a5c] tracking-tight">{title}</h2>
           <SplashIcon className="text-indigo-300" flipped size={28} />
        </div>
        <p className="text-[#2d2a5c] font-medium mt-1 mb-6 text-center">{subtitle}</p>

        {/* Word Display */}
        <div className="flex flex-col items-center w-full">
          <p className="text-sm text-gray-500 font-medium mb-3">The word was:</p>
          <div className="flex items-center justify-center gap-2 w-full">
            <SplashIcon className="text-indigo-300" size={20} />
            {revealedWord && revealedWord.split("").map((letter, i) => (
              <div key={i} className="flex items-center justify-center w-11 h-11 rounded-[0.6rem] bg-indigo-50 text-indigo-600 font-extrabold text-xl shadow-sm border border-indigo-100/50">
                {letter.toUpperCase()}
              </div>
            ))}
            <SplashIcon className="text-indigo-300" flipped size={20} />
          </div>
        </div>

        {/* Divider */}
        <div className="w-4/5 h-px bg-gradient-to-r from-transparent via-indigo-100 to-transparent my-8" />

        {/* Countdown Ring */}
        {countdown !== null && (
          <div className="flex flex-col items-center">
            <p className="text-[10px] font-extrabold text-indigo-400 tracking-[0.2em] mb-3 uppercase">Next round in</p>
            <div className="relative flex items-center justify-center w-24 h-24">
              {/* SVG Ring */}
              <svg className="absolute inset-0 w-full h-full -rotate-90">
                <circle
                  cx="48"
                  cy="48"
                  r={circleRadius}
                  fill="none"
                  stroke="#eef2ff"
                  strokeWidth="6"
                />
                <circle
                  cx="48"
                  cy="48"
                  r={circleRadius}
                  fill="none"
                  stroke="url(#gradient)"
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  className="transition-all duration-1000 ease-linear"
                />
                <defs>
                  <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#818cf8" />
                    <stop offset="100%" stopColor="#c058f8" />
                  </linearGradient>
                </defs>
              </svg>
              {/* Number */}
              <span className="text-4xl font-black text-[#2d2a5c]">{countdown}</span>
              
              {/* Little floating dots for aesthetics */}
              <div className="absolute top-0 right-2 w-1 h-1 rounded-full bg-purple-300" />
              <div className="absolute bottom-2 left-1 w-1.5 h-1.5 rounded-full bg-indigo-300" />
            </div>
          </div>
        )}

        {/* Tip Box */}
        <div className="mt-8 w-full bg-indigo-50/70 rounded-2xl p-3 px-4 flex items-center gap-3 border border-indigo-100/50">
          <div className="flex-shrink-0 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm text-indigo-400">
            <Zap size={16} className="fill-indigo-100" />
          </div>
          <p className="text-xs text-indigo-900/70 font-medium leading-relaxed text-left flex-1">
            {tipText}
          </p>
        </div>

        </div>
      </div>
    </div>
  );
}
