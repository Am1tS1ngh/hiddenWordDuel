"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { io } from "socket.io-client";
/* ── Floating background tile data ── */
import FloatingBackground from "./components/FloatingBackground";

export default function Home() {
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const [playerCount, setPlayerCount] = useState<number | null>(null);

  const router = useRouter();

  /* ── Mouse reveal state ── */
  const [mousePos, setMousePos] = useState({ x: -1000, y: -1000 });
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  }, []);

  const handleMouseLeave = useCallback(() => {
    setMousePos({ x: -1000, y: -1000 });
  }, []);

  const handleJoinGame = () => {
    const trimmed = username.trim();
    if (!trimmed) {
      setError("Please enter a username.");
      return;
    }
    if (trimmed.length < 2 || trimmed.length > 15) {
      setError("Username must be 2–15 characters.");
      return;
    }
    localStorage.setItem("wordDuel_username", trimmed);
    router.push("/game");
  };

  useEffect(() => {
    const SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:5000";
    const socket = io(SERVER_URL, {
      transports: ["polling", "websocket"],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 3,
    });

    socket.on("onlineCount", (data: { count: number }) => {
      setPlayerCount(data.count);
    });

    return () => {
      socket.off("onlineCount");
      socket.disconnect();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative min-h-screen overflow-hidden bg-gradient-to-b from-[#f0eef6] via-[#f5f3fa] to-[#fbfaff]"
    >

      {/* ─── NAV BAR ─── */}
      <nav className="relative z-20 flex hidden items-center justify-between px-6 sm:px-10 py-5">
        <div className="flex items-center gap-2.5">
          <div className="flex gap-1">
            <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-500 text-white text-xs font-bold shadow-sm -rotate-6">H</span>
            <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-violet-500 text-white text-xs font-bold shadow-sm rotate-6">W</span>
          </div>
          <span className="text-sm font-bold text-gray-800 tracking-tight">Hidden Word Duel</span>
        </div>

        <button className="flex items-center gap-2 px-4 py-2 rounded-full border border-gray-200 bg-white/80 backdrop-blur-sm text-sm font-medium cursor-pointer hidden text-gray-600 hover:border-indigo-200 hover:text-indigo-600 transition-all shadow-sm">
          <span>📖</span>
          <span>How to Play</span>
        </button>
      </nav>

      {/* ─── BACKGROUND TILES (Blurred layer) ─── */}
      <FloatingBackground mousePos={mousePos} />

      {/* ─── HERO CONTENT ─── */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-[calc(100vh-80px)] px-4">

        {/* Feature tiles */}
        <div className="flex justify-center items-end gap-3 mb-8 animate-fade-in-scale" style={{ animationDelay: "0.1s" }}>
          <div className="px-5 py-3 rounded-xl bg-white border border-gray-100 shadow-md text-indigo-600 font-bold text-sm tracking-wide -rotate-3">
            HIDDEN
          </div>
          <div className="px-5 py-3 rounded-xl bg-white border border-gray-100 shadow-md text-indigo-600 font-bold text-sm tracking-wide rotate-1 -translate-y-2">
            WORD
          </div>
          <div className="px-5 py-3 rounded-xl bg-white border border-gray-100 shadow-md text-violet-600 font-bold text-sm tracking-wide -rotate-1">
            DUEL
          </div>
        </div>

        {/* Category label */}
        <p
          className="text-xs font-semibold uppercase tracking-[0.25em] text-indigo-400 mb-4 animate-fade-in-scale"
          style={{ animationDelay: "0.25s" }}
        >
          Real-time &bull; Multiplayer &bull; Word Game
        </p>

        {/* Title */}
        <h1
          className="text-5xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-center leading-tight mb-4 animate-fade-in-scale"
          style={{ animationDelay: "0.35s", animation: "fadeInScale 0.6s 0.35s ease-out forwards, titleGlow 4s 1s ease-in-out infinite" }}
        >
          <span className="text-gray-800">Hidden Word </span>
          <span className="text-indigo-600">Duel</span>
        </h1>

        {/* Decorative divider */}
        <div className="flex items-center gap-2 mb-4 animate-fade-in-scale" style={{ animationDelay: "0.4s" }}>
          <div className="w-8 h-px bg-gray-300" />
          <span className="text-indigo-400 text-sm">⚔</span>
          <div className="w-8 h-px bg-gray-300" />
        </div>

        {/* Subtitle */}
        <p
          className="text-base sm:text-lg text-gray-500 text-center max-w-md mb-10 leading-relaxed animate-fade-in-scale"
          style={{ animationDelay: "0.5s" }}
        >
          Guess the word before your opponent.<br />
          Letter by letter. Tick by tick.
        </p>

        {/* Input + CTA */}
        <div
          className="flex items-center gap-0 bg-white rounded-full border border-gray-200 shadow-lg pl-4 pr-1.5 py-1.5 w-full max-w-md animate-fade-in-scale"
          style={{ animationDelay: "0.6s" }}
        >
          <span className="text-gray-400 mr-2">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </span>
          <input
            id="username-input"
            type="text"
            value={username}
            onChange={(e) => { setUsername(e.target.value); setError(""); }}
            onKeyDown={(e) => e.key === "Enter" && handleJoinGame()}
            placeholder="Enter your name"
            maxLength={15}
            autoFocus
            className="flex-1 bg-transparent text-gray-800 placeholder-gray-400 text-sm outline-none py-2 rounded-full [&:-webkit-autofill]:bg-transparent [&:-webkit-autofill]:shadow-[inset_0_0_0_1000px_white]"

          />
          <button
            id="join-game-btn"
            onClick={handleJoinGame}
            className="flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-[0.97] transition-all shadow-md hover:shadow-lg cursor-pointer whitespace-nowrap"
          >
            Play Now
            <span>→</span>
          </button>
        </div>
        {error && (
          <p className="mt-3 text-xs text-red-500 animate-fade-in-scale">{error}</p>
        )}

        {/* Online indicator */}
        <div
          className="mt-5 flex items-center gap-2 text-sm text-gray-400 animate-fade-in-scale"
          style={{ animationDelay: "0.75s" }}
        >
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span>Online players: <span className="font-semibold text-gray-500">{playerCount ?? "--"}</span></span>

        </div>
      </div>
    </div>
  );
}
