"use client";

import { useEffect, useState } from "react";

export const BG_TILES = [
  // Top edges & corners
  { word: "HIDDEN", top: "5%", left: "7%", rotate: -12, size: "text-sm", delay: 0, blur: 2 },
  { word: "PLAY", top: "3%", left: "22%", rotate: 8, size: "text-xs", delay: 0.5, blur: 2 },
  { word: "CLUE", top: "8%", left: "42%", rotate: -6, size: "text-xs", delay: 2.1, blur: 3 },
  { word: "ROUND", top: "3%", left: "58%", rotate: 10, size: "text-xs", delay: 1.9, blur: 2 },
  { word: "WORD", top: "11%", left: "80%", rotate: -15, size: "text-sm", delay: 1.2, blur: 1 },
  { word: "VICTORY", top: "9%", left: "90%", rotate: -10, size: "text-sm", delay: 1.5, blur: 2 },
  
  // Left edges
  { word: "GUESS", top: "20%", left: "4%", rotate: 7, size: "text-xs", delay: 0.8, blur: 3 },
  { word: "LETTER", top: "35%", left: "5%", rotate: -8, size: "text-xs", delay: 1.8, blur: 4 },
  { word: "DUEL", top: "45%", left: "2%", rotate: -14, size: "text-sm", delay: 1.0, blur: 3 },
  { word: "PUZZLE", top: "60%", left: "8%", rotate: 12, size: "text-sm", delay: 0.4, blur: 1 },
  { word: "WIN", top: "75%", left: "3%", rotate: -9, size: "text-xs", delay: 2.0, blur: 4 },
  { word: "THINK", top: "85%", left: "5%", rotate: 15, size: "text-sm", delay: 2.4, blur: 2 },
  { word: "TIMER", top: "25%", left: "12%", rotate: 9, size: "text-xs", delay: 2.7, blur: 3 },
  
  // Center / Mid-screen (Added back with blurs so they don't overpower the UI)
  { word: "MYSTIC", top: "30%", left: "25%", rotate: -11, size: "text-xs", delay: 1.0, blur: 2 },
  { word: "MATCH", top: "28%", left: "75%", rotate: 8, size: "text-xs", delay: 2.3, blur: 4 },
  { word: "LEGEND", top: "65%", left: "22%", rotate: -7, size: "text-xs", delay: 2.8, blur: 1 },
  { word: "SCORE", top: "60%", left: "72%", rotate: 14, size: "text-xs", delay: 1.7, blur: 3 },
  { word: "BATTLE", top: "45%", left: "82%", rotate: 11, size: "text-xs", delay: 0.6, blur: 3 },
  
  // Right edges
  { word: "TICK", top: "16%", left: "88%", rotate: 13, size: "text-xs", delay: 0.3, blur: 6 },
  { word: "REVEAL", top: "45%", left: "92%", rotate: -10, size: "text-sm", delay: 2.5, blur: 1 },
  { word: "FOCUS", top: "58%", left: "88%", rotate: 9, size: "text-sm", delay: 0.7, blur: 2 },
  { word: "SOLVE", top: "68%", left: "95%", rotate: -6, size: "text-xs", delay: 1.1, blur: 5 },
  { word: "SPEED", top: "82%", left: "92%", rotate: -12, size: "text-xs", delay: 1.1, blur: 5 },
  { word: "CLASH", top: "90%", left: "88%", rotate: -8, size: "text-xs", delay: 2.0, blur: 2 },
  
  // Bottom edges
  { word: "STREAK", top: "92%", left: "15%", rotate: -15, size: "text-xs", delay: 1.4, blur: 3},
  { word: "SWIFT", top: "95%", left: "25%", rotate: 8, size: "text-xs", delay: 0.6, blur: 1 },
  { word: "CHAMPION", top: "88%", left: "45%", rotate: -5, size: "text-sm", delay: 1.6, blur: 1 },
  { word: "DECODE", top: "92%", left: "65%", rotate: -9, size: "text-sm", delay: 1.4, blur: 1 },
  { word: "BONUS", top: "85%", left: "75%", rotate: 7, size: "text-sm", delay: 2.2, blur: 2 },
  { word: "RIVAL", top: "96%", left: "55%", rotate: 12, size: "text-xs", delay: 0.2, blur: 0.5 },
];

interface FloatingBackgroundProps {
  mousePos?: { x: number; y: number };
}

export default function FloatingBackground({ mousePos }: FloatingBackgroundProps) {
  const [windowSize, setWindowSize] = useState({ width: 1440, height: 900 });

  useEffect(() => {
    if (typeof window !== "undefined") {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
      
      const handleResize = () => {
        setWindowSize({ width: window.innerWidth, height: window.innerHeight });
      };
      
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, []);

  return (
    <div className="absolute inset-0 z-0 pointer-events-none">
      {BG_TILES.map((tile, i) => {
        const floatAnim = i % 2 === 0 ? "tileFloatUp" : "tileFloatDown";
        const floatDuration = 5 + (i % 5);

        let inReveal = false;
        if (mousePos && mousePos.x !== -1000 && mousePos.y !== -1000) {
          const dx = mousePos.x - (parseFloat(tile.left) / 100) * windowSize.width;
          const dy = mousePos.y - (parseFloat(tile.top) / 100) * windowSize.height;
          const dist = Math.sqrt(dx * dx + dy * dy);
          inReveal = dist < 140;
        }

        return (
          <div
            key={i}
            className="absolute select-none"
            style={{
              top: tile.top,
              left: tile.left,
              transform: `rotate(${tile.rotate}deg) scale(${inReveal ? 1.05 : 1})`,
              transition: "transform 0.4s ease-out",
              zIndex: 0,
            }}
          >
            <div
              className="px-4 py-2.5 rounded-xl border font-bold uppercase tracking-wider"
              style={{
                fontSize: tile.size === "text-sm" ? "14px" : "12px",
                color: inReveal ? "#5b4a9e" : "#9d93c0",
                background: inReveal ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.55)",
                borderColor: inReveal ? "#b8aee0" : "rgba(180,170,210,0.4)",
                boxShadow: inReveal
                  ? "0 4px 24px rgba(100,80,180,0.15)"
                  : "0 2px 10px rgba(100,80,180,0.06)",
                filter: inReveal ? "blur(0px)" : `blur(${tile.blur}px)`,
                opacity: inReveal ? 1 : (tile.blur <= 2 ? 0.7 : tile.blur <= 4 ? 0.5 : 0.35),
                transition: "filter 0.4s ease-out, opacity 0.4s ease-out, color 0.4s ease-out, background 0.4s ease-out, border-color 0.4s ease-out, box-shadow 0.4s ease-out",
                animation: `${floatAnim} ${floatDuration}s ${tile.delay}s ease-in-out infinite`,
              }}
            >
              {tile.word}
            </div>
          </div>
        );
      })}
    </div>
  );
}
