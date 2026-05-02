"use client";

interface TileDisplayProps {
  visibleWord: string[];
}

export default function TileDisplay({ visibleWord }: TileDisplayProps) {
  return (
    <div className="flex flex-wrap justify-center gap-2">
      {visibleWord.map((char, i) => {
        const isRevealed = char !== "_";
        return (
          <div
            key={i}
            className={`w-12 h-14 sm:w-14 sm:h-16 flex items-center justify-center rounded-[1rem] text-2xl sm:text-3xl font-bold uppercase border transition-all duration-300 ${
              isRevealed
                ? "bg-indigo-50 border-indigo-100 text-indigo-600 scale-105 shadow-[0_4px_12px_rgba(99,102,241,0.12)]"
                : "bg-white border-[#f0eef5] text-gray-800 shadow-sm"
            }`}
          >
            {isRevealed ? char : <span className="w-4 h-1 rounded-full bg-gray-300 mt-4"></span>}
          </div>
        );
      })}
    </div>
  );
}
