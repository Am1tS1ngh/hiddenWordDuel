"use client";

interface RoundIndicatorProps {
  roundNumber: number;
  totalRounds: number;
}

export default function RoundIndicator({ roundNumber, totalRounds }: RoundIndicatorProps) {
  return (
    <div className="flex flex-col items-center gap-1 mt-1">
      {/* Dots */}
      <div className="flex items-center gap-2">
        {Array.from({ length: totalRounds }, (_, i) => {
          const isActive = i < roundNumber;
          return (
            <div
              key={i}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                isActive
                  ? "bg-indigo-600 scale-110 shadow-sm"
                  : "bg-[#e2e2ec]"
              }`}
            />
          );
        })}
      </div>
      
      {/* Text */}
      <span className="text-xs text-gray-500 font-medium tracking-wide">
        Round {Math.max(1, roundNumber)} of {totalRounds}
      </span>
    </div>
  );
}
