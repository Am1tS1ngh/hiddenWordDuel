"use client";

import { useEffect, useRef, useState } from "react";

interface TimerProps {
  tickDuration: number;
}

export default function Timer({ tickDuration }: TimerProps) {
  const [timeLeft, setTimeLeft] = useState(tickDuration);
  const startTimeRef = useRef(Date.now());

  useEffect(() => {
    startTimeRef.current = Date.now();
    setTimeLeft(tickDuration);

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const remaining = Math.max(0, tickDuration - elapsed);
      setTimeLeft(remaining);
    }, 50); // Faster tick for smoother gradient animation

    return () => clearInterval(interval);
  }, [tickDuration]);

  const seconds = (timeLeft / 1000).toFixed(1);
  const progress = (timeLeft / tickDuration) * 100;

  return (
    <div className="w-full max-w-md mx-auto mt-2">
      <div className="flex justify-between text-xs mb-2 px-1">
        <span className="text-gray-500 font-medium tracking-wide">Time left</span>
        <span className="font-bold text-rose-600 tracking-wider">
          {seconds}s
        </span>
      </div>
      
      {/* Progress Bar Container */}
      <div className="relative w-full h-2.5 bg-[#e8e5f0] rounded-full overflow-hidden shadow-inner">
        {/* Gradient Bar */}
        <div
          className="absolute top-0 left-0 h-full rounded-full bg-gradient-to-r from-rose-600 via-purple-500 to-blue-500 transition-all duration-75 ease-linear"
          style={{ width: `${progress}%` }}
        >
          {/* Glowing Dot at the end (flare) */}
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-white rounded-full shadow-[0_0_10px_rgba(255,255,255,0.9),0_0_15px_rgba(244,63,94,0.8)]" />
        </div>
      </div>
    </div>
  );
}
