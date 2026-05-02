"use client";

import { useState } from "react";
import { Keyboard, ArrowRight } from "lucide-react"; 

interface GuessInputProps {
  onSubmit: (guess: string) => void;
  disabled: boolean;
}

export default function GuessInput({ onSubmit, disabled }: GuessInputProps) {
  const [guess, setGuess] = useState("");

  const handleSubmit = () => {
    const trimmed = guess.trim();
    if (!trimmed) return;
    onSubmit(trimmed);
    setGuess("");
  };

  return (
    <div className="w-full max-w-[360px] mx-auto flex items-center bg-white p-1 rounded-2xl border border-[#e8e5f0] shadow-sm focus-within:ring-2 focus-within:ring-purple-500/20 focus-within:border-purple-300 transition-all">
      <div className="pl-3 pr-1 text-indigo-500">
         <Keyboard className="w-4 h-4 opacity-60" />
      </div>
      <input
        id="guess-input"
        type="text"
        value={guess}
        onChange={(e) => setGuess(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && !disabled && handleSubmit()}
        placeholder={disabled ? "Wait..." : "Type your guess..."}
        disabled={disabled}
        autoFocus
        className="flex-1 px-1 py-2 bg-transparent text-gray-800 placeholder-gray-400 text-sm outline-none disabled:opacity-40"
      />
      <button
        id="submit-guess-btn"
        onClick={handleSubmit}
        disabled={disabled || !guess.trim()}
        className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-indigo-200"
      >
        Submit <ArrowRight className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
