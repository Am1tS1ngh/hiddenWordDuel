"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useSocket } from "../hooks/useSocket";
import TileDisplay from "../components/TileDisplay";
import GuessInput from "../components/GuessInput";
import Timer from "../components/Timer";
import Scoreboard from "../components/Scoreboard";
import RoundIndicator from "../components/RoundIndicator";
import StatusMessage from "../components/StatusMessage";
import MatchEndScreen from "../components/MatchEndScreen";
import WaitingScreen from "../components/WaitingScreen";
import FloatingBackground from "../components/FloatingBackground";
import RoundEndOverlay from "../components/RoundEndOverlay";

type GamePhase = "waiting" | "playing" | "roundEnd" | "matchEnd";

interface MatchEndData {
    winner: string | null;
    finalScores: Record<string, number>;
    reason?: string;
}

export default function GamePage() {
    const { socket, isConnected } = useSocket();

    const [phase, setPhase] = useState<GamePhase>("waiting");
    const [roundId, setRoundId] = useState("");
    const [roundNumber, setRoundNumber] = useState(0);
    const [visibleWord, setVisibleWord] = useState<string[]>([]);
    const [scores, setScores] = useState<Record<string, number>>({});
    const [tickActive, setTickActive] = useState(false);
    const [tickDuration, setTickDuration] = useState(5000);
    const [tickCount, setTickCount] = useState(0);


    const [statusMsg, setStatusMsg] = useState("Connecting to server...");
    const [matchEndData, setMatchEndData] = useState<MatchEndData | null>(null);
    const [revealedWord, setRevealedWord] = useState("");
    const [username, setUsername] = useState("");
    const [playerId, setPlayerId] = useState<string | null>(null);
    const [countdown, setCountdown] = useState<number | null>(null);
    const hasRegistered = useRef(false);
    const playerIdRef = useRef<string | null>(null);


    // Read stored username
    useEffect(() => {
        const stored = localStorage.getItem("wordDuel_username") || "Player";
        setUsername(stored);
    }, []);

    // Socket event listeners

    useEffect(() => {
        if (!socket) return;

        socket.on("requestRegister", () => {
            if (hasRegistered.current) return;

            hasRegistered.current = true;

            console.log("📡 Server asked to register");

            socket.emit("registerPlayer", {
                username: localStorage.getItem("wordDuel_username"),
            });
        });

        return () => {
            socket.off("requestRegister");
        };
    }, [socket]);

    useEffect(() => {
        if (!socket) return;

        socket.on("playerRegistered", (data) => {
            console.log("✅ playerRegistered:", data);

            localStorage.setItem("playerId", data.playerId);
            playerIdRef.current = data.playerId; 
            setPlayerId(data.playerId);
        });

        socket.on("waitingForOpponent", (data: { message: string }) => {
            setPhase("waiting");
            setStatusMsg(data.message);
        });

        socket.on("startRound", (data: { roundId: string; wordLength: number; roundNumber: number }) => {
            setCountdown(null);
            setRevealedWord("");
            setStatusMsg("");
            setTickActive(false);
            setRoundId(data.roundId);
            setRoundNumber(data.roundNumber);
            setVisibleWord(new Array(data.wordLength).fill("_"));
        });

        socket.on("tickStart", (data: {
            revealedTiles: boolean[];
            visibleWord: string[];
            scores: Record<string, number>;
            serverTime: number;
            tickDuration: number;
        }) => {
            setVisibleWord(data.visibleWord);
            setScores(data.scores);
            setTickDuration(data.tickDuration);
            setTickActive(true);
            setStatusMsg("Type your guess!");
            setTickCount((prev) => prev + 1);
            setPhase("playing");
        });

        socket.on("revealTile", (data: { index: number; letter: string }) => {
            setVisibleWord((prev) => {
                const updated = [...prev];
                updated[data.index] = data.letter;
                return updated;
            });
        });

        socket.on("roundEnd", (data: {
            winner: string | null;
            revealedWord: string;
            scores: Record<string, number>;
            roundNumber: number;
        }) => {
            setScores(data.scores);
            setRevealedWord(data.revealedWord);
            setVisibleWord(data.revealedWord.split(""));

            const myId = playerIdRef.current;
            if (!data.winner) {
                setStatusMsg("Draw! No one scores this round.");
            } else if (myId && data.winner === myId) {
                setStatusMsg("🎉 You won this round!");
            } else {
                setStatusMsg("Opponent won this round.");
            }
            setPhase("roundEnd");
            setTickActive(false);

        });

        socket.on("roundCountdown", (data: { seconds: number }) => {
            let remaining = data.seconds;
            setCountdown(remaining);
            const interval = setInterval(() => {
                remaining -= 1;
                if (remaining <= 0) {
                    clearInterval(interval);
                } else {
                    setCountdown(remaining);
                }
            }, 1000);
        });


        socket.on("matchEnd", (data: MatchEndData) => {
            setPhase("matchEnd");
            setTickActive(false);
            setMatchEndData(data);
        });

        socket.on("opponentDisconnected", (data: { message: string }) => {
            setStatusMsg(data.message);
        });

        socket.on("guessRejected", (data: { reason: string }) => {
            setStatusMsg(`❌ ${data.reason}`);
        });

        socket.on("guessResult", (data: { correct: boolean }) => {
            if (!data.correct) {
                setStatusMsg("Wrong guess — wait for the next tick.");
            }
        });

        return () => {
            socket.off("waitingForOpponent");
            socket.off("startRound");
            socket.off("tickStart");
            socket.off("revealTile");
            socket.off("roundEnd");
            socket.off("matchEnd");
            socket.off("opponentDisconnected");
            socket.off("roundCountdown");
            socket.off("guessRejected");
            socket.off("guessResult");
        };
    }, [socket]);

    const handleSubmitGuess = useCallback(
        (guessText: string) => {
            if (!socket || !tickActive) return;
            socket.emit("submitGuess", { roundId, guessText });
            setStatusMsg("Guess submitted — waiting...");
        },
        [socket, roundId, tickActive],
    );

    const handlePlayAgain = useCallback(() => {
        if (socket) {
            socket.disconnect();
            socket.connect();
        }
        setPhase("waiting");
        setTickActive(false);
        setMatchEndData(null);
        setScores({});
        setRoundNumber(0);
        setStatusMsg("Looking for a new opponent...");
    }, [socket]);

    return (
        <div className="relative w-full h-[100dvh] bg-gradient-to-b from-[#f0eef6] via-[#f5f3fa] to-[#fbfaff] overflow-hidden font-sans">

            {/* Floating Background Words */}
            <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
                <FloatingBackground />
            </div>

            {/* Subtle radial gradient to center the focus */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white/40 via-transparent to-transparent pointer-events-none z-0" />
            {phase === "matchEnd" && matchEndData && (
                <MatchEndScreen
                    winner={matchEndData.winner}
                    finalScores={matchEndData.finalScores}
                    playerId={playerId}
                    reason={matchEndData.reason}
                    onPlayAgain={handlePlayAgain}
                />
            )}

            <div className="relative z-10 w-full h-full overflow-y-auto overflow-x-hidden custom-scrollbar">
                <div className="flex flex-col items-center justify-center min-h-full py-8 sm:py-12 px-4">
                    <div className="flex flex-col items-center gap-2 sm:gap-4 w-full max-w-lg mx-auto">

                        <div className="text-center mt-2">
                            {/* Logo tiles */}
                            <div className="flex justify-center items-center gap-4 mb-4">
                                <span className="relative flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-[1.25rem] bg-gradient-to-br from-[#6b72ff] to-[#4c55fc] text-white text-2xl font-bold shadow-[0_10px_24px_rgba(107,114,255,0.4)] -rotate-[8deg] border-t border-l border-white/40">
                                    H
                                </span>
                                <span className="text-2xl text-[#818cf8] font-light">⚔</span>
                                <span className="relative flex items-center justify-center w-14 h-14 rounded-[1.25rem] bg-gradient-to-br from-[#c058f8] to-[#a339ea] text-white text-2xl font-bold shadow-[0_10px_24px_rgba(192,88,248,0.4)] rotate-[8deg] border-t border-l border-white/40">
                                    W
                                </span>
                            </div>

                            {/* Title */}
                            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight">
                                <span className="text-gray-800">Hidden Word </span>
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-[#6b72ff]">Duel</span>
                            </h1>

                            {/* Subtitle */}
                            <p className="mt-2 text-sm text-gray-400 font-medium">
                                Guess the word before your opponent
                            </p>

                            {/* VS Bar */}
                            <div className="mt-5 inline-flex items-center gap-4 bg-white border border-gray-100 shadow-md px-6 py-2.5 rounded-full text-sm font-medium text-gray-600">
                                <span className="flex items-center gap-2">
                                    <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-indigo-100 text-indigo-600 text-xs font-bold">
                                        {username.charAt(0).toUpperCase()}
                                    </span>
                                    <span className="font-bold text-gray-800">{username}</span>
                                </span>
                                <span className="text-gray-300 font-semibold">vs</span>
                                {phase === "waiting" ? (
                                    <span className="flex items-center gap-2 text-gray-400">
                                        <span>searching for opponent</span>
                                        <span className="flex gap-0.5">
                                            {[0, 1, 2].map((i) => (
                                                <span
                                                    key={i}
                                                    className="w-1.5 h-1.5 rounded-full bg-violet-500 inline-block"
                                                    style={{
                                                        animation: `bounceDot 1.4s ${i * 0.2}s ease-in-out infinite`,
                                                    }}
                                                />
                                            ))}
                                        </span>
                                    </span>
                                ) : (
                                    <span className="text-gray-400">opponent</span>
                                )}
                            </div>
                        </div>

                        {phase !== "waiting" && (
                            <div className="w-full flex flex-col items-center gap-3">
                                {playerId && (
                                    <Scoreboard scores={scores} myPlayerId={playerId} />
                                )}
                                <RoundIndicator roundNumber={roundNumber} totalRounds={5} />
                            </div>
                        )}

                        {phase === "waiting" && (
                            <WaitingScreen message={statusMsg} />
                        )}

                        {phase === "playing" && (
                            <TileDisplay visibleWord={visibleWord} />
                        )}

                        {phase === "playing" && (
                            <Timer key={tickCount} tickDuration={tickDuration} />
                        )}


                        {phase === "playing" && (
                            <GuessInput onSubmit={handleSubmitGuess} disabled={!tickActive} />
                        )}

                        {phase === "playing" && statusMsg && <StatusMessage message={statusMsg} />}

                        {phase === "roundEnd" && (
                            <RoundEndOverlay
                                statusMsg={statusMsg}
                                revealedWord={revealedWord}
                                countdown={countdown}
                                maxCountdown={5}
                            />
                        )}



                    </div>
                </div>
            </div>
        </div>
    );
}
