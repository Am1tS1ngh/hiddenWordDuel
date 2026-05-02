"use client";

import { Trophy, Frown, Flag, RotateCcw } from "lucide-react";
import { SplashIcon } from "./RoundEndOverlay";

/* ---------- Main Component ---------- */
export default function MatchEndScreen({
  winner,
  finalScores,
  playerId,
  reason,
  onPlayAgain,
}: any) {
  const iWon = winner === playerId;
  const isDraw = winner === null;
  const isLose = !iWon && !isDraw;

  const players = Object.keys(finalScores);
  const myScore = finalScores[playerId] ?? 0;
  const opponentId = players.find((id) => id !== playerId) || "";
  const opponentScore = finalScores[opponentId] ?? 0;

  const title = isDraw ? "It's a Tie!" : iWon ? "Victory!" : "Defeat";
  const subtitle = isDraw
    ? "So close! That was intense."
    : iWon
    ? "Well played. You dominated!"
    : "Tough round. Try again!";

  const glowColor = iWon
    ? "bg-amber-400"
    : isLose
    ? "bg-rose-400"
    : "bg-gray-300";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">

      {/* ---------- Animated Confetti (WIN only) ---------- */}
      {iWon && (
        <>
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-6 rounded-full opacity-70 animate-confetti"
              style={{
                background: ["#f59e0b", "#8b5cf6", "#10b981", "#ec4899"][i % 4],
                left: `${20 + i * 10}%`,
                top: `${10 + i * 5}%`,
                animationDelay: `${i * 0.2}s`,
              }}
            />
          ))}
        </>
      )}

      {/* ---------- Card ---------- */}
      <div className="relative w-full max-w-[420px]  animate-scaleIn">

        <div className="relative flex flex-col items-center bg-white rounded-[2rem] p-8 pt-16 shadow-[0_25px_60px_rgba(0,0,0,0.15)]">

          {/* ---------- Top Icon Glow ---------- */}
          <div className="absolute -top-10 left-1/2 -translate-x-1/2">
            <div className="relative">
              <div className={`absolute inset-0 rounded-full blur-2xl opacity-40 ${glowColor}`} />
              <div className="relative w-20 h-20 rounded-full bg-white flex items-center justify-center shadow-md">
                {iWon && <Trophy size={34} className="text-amber-500" />}
                {isLose && <Frown size={34} className="text-rose-500" />}
                {isDraw && <Flag size={34} className="text-gray-500" />}
              </div>
            </div>
          </div>

          {/* ---------- Title ---------- */}
          <div className="flex items-center gap-3 mt-2">
             <SplashIcon className="text-indigo-300" size={28} />
            <h2 className="text-4xl font-black text-[#2d2a5c]">{title}</h2>
             <SplashIcon className="text-indigo-300" flipped size={28} />
          </div>

          <p className="text-gray-500 mt-3 mb-6 text-center text-sm">
            {reason || subtitle}
          </p>

          {/* ---------- Divider ---------- */}
          <div className="w-full h-px bg-gradient-to-r from-transparent via-indigo-100 to-transparent mb-8" />

          {/* ---------- Scores ---------- */}
          <div className="flex w-full items-center justify-between mb-10 relative">

            {/* YOU */}
            <div className="flex flex-col items-center w-[40%]">
              <span className="text-xs font-bold text-indigo-400 uppercase mb-2">You</span>
              <div className={`w-20 h-24 rounded-2xl flex items-center justify-center border transition-all
                ${iWon ? "bg-indigo-50 border-indigo-200 scale-105 shadow-md" : "bg-gray-50 border-gray-100"}`}>
                <span className={`text-5xl font-black ${iWon ? "text-indigo-600" : "text-gray-400"}`}>
                  {myScore}
                </span>
              </div>
            </div>

            {/* VS */}
            <span className="text-2xl font-black text-gray-300 absolute left-1/2 -translate-x-1/2">
              VS
            </span>

            {/* OPPONENT */}
            <div className="flex flex-col items-center w-[40%]">
              <span className="text-xs font-bold text-gray-400 uppercase mb-2">Opponent</span>
              <div className={`w-20 h-24 rounded-2xl flex items-center justify-center border transition-all
                ${isLose ? "bg-rose-50 border-rose-200 scale-105 shadow-md" : "bg-gray-50 border-gray-100"}`}>
                <span className={`text-5xl font-black ${isLose ? "text-rose-600" : "text-gray-400"}`}>
                  {opponentScore}
                </span>
              </div>
            </div>

          </div>

          {/* ---------- Button ---------- */}
          <button
            onClick={onPlayAgain}
            className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl text-white font-bold text-lg
            bg-gradient-to-r from-indigo-500 to-purple-600
            shadow-[0_12px_30px_rgba(99,102,241,0.4)]
            hover:scale-[1.03] hover:shadow-xl
            active:scale-[0.97] transition-all"
          >
            <RotateCcw size={20} />
            Play Again
          </button>

        </div>
      </div>
   </div>
  );
}