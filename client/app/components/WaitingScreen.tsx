"use client";

import { useState, useEffect } from "react";

interface WaitingScreenProps {
    message: string;
}

const colors = [
    { bg: "#ede9fe", border: "#c4b5fd", text: "#7c3aed", glow: "#c4b5fd" },
    { bg: "#dcfce7", border: "#86efac", text: "#16a34a", glow: "#86efac" },
    { bg: "#dbeafe", border: "#93c5fd", text: "#2563eb", glow: "#93c5fd" },
    { bg: "#fef3c7", border: "#fcd34d", text: "#d97706", glow: "#fcd34d" },
    { bg: "#fce7f3", border: "#f9a8d4", text: "#db2777", glow: "#f9a8d4" },
    { bg: "#e0f2fe", border: "#7dd3fc", text: "#0284c7", glow: "#7dd3fc" },
    { bg: "#ffedd5", border: "#fdba74", text: "#ea580c", glow: "#fdba74" },
];

const searchMessages = [
    "Looking for an opponent",
    "Finding a match",
    "Connecting players",
    "Almost there",
];

const tips = [
    "New letters are revealed every few seconds. Think fast!",
    "The earlier you guess, the more impressive the win!",
    "Watch the pattern — sometimes vowels reveal first.",
    "Stay focused. Your opponent might guess before you!",
];

export default function WaitingScreen({ message }: WaitingScreenProps) {
    const [msgIndex, setMsgIndex] = useState(0);
    const [tipIndex, setTipIndex] = useState(0);

    useEffect(() => {
        const msgInterval = setInterval(() => {
            setMsgIndex((prev) => (prev + 1) % searchMessages.length);
        }, 4000);
        const tipInterval = setInterval(() => {
            setTipIndex((prev) => (prev + 1) % tips.length);
        }, 6000);
        return () => {
            clearInterval(msgInterval);
            clearInterval(tipInterval);
        };
    }, []);

    const displayMsg = searchMessages[msgIndex];
    const words = displayMsg.split(" ");
    const allChars = displayMsg.replace(/ /g, "").length;

    let charCount = 0;

    return (
        <div className="flex flex-col items-center gap-8 py-6">
            {/* Letter tiles */}
            <div className="flex flex-wrap justify-center gap-x-4 gap-y-3" key={msgIndex}>
                {words.map((word, wi) => (
                    <div key={wi} className="flex gap-1.5">
                        {word.split("").map((char, ci) => {
                            charCount++;
                            const popDelay = wi * 0.15 + ci * 0.05;
                            const color = colors[(wi + ci) % colors.length];
                            const isLast = charCount === allChars;
                            const popAnim = isLast
                                ? `revealPopStrong 0.5s ${popDelay}s ease-out forwards`
                                : `revealPop 0.4s ${popDelay}s ease-out forwards`;
                            return (
                                <span
                                    key={ci}
                                    className="relative inline-flex items-center justify-center w-11 h-12 rounded-xl text-sm font-bold uppercase border-2"
                                    style={{
                                        opacity: 0,
                                        animation: `${popAnim}, float 3s ${popDelay + 0.5}s ease-in-out infinite`,
                                        background: color.bg,
                                        borderColor: color.border,
                                        color: color.text,
                                        boxShadow: `0 4px 12px ${color.glow}50`,
                                    }}
                                >
                                    {char}
                                    {/* Bottom glow */}
                                    <span
                                        className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-6 h-2 rounded-full blur-sm"
                                        style={{
                                            background: color.glow,
                                            opacity: 0.4,
                                            animation: `glowPulse 2s ${popDelay}s ease-in-out infinite`,
                                        }}
                                    />
                                </span>
                            );
                        })}
                    </div>
                ))}

            </div>

            {/* Tip box */}
            <div className="flex items-start gap-3 bg-white/80 backdrop-blur-sm border border-gray-100 rounded-2xl px-5 py-4 max-w-sm shadow-sm">
                <span className="text-xl mt-0.5">💡</span>
                <div>
                    <p className="text-xs font-semibold text-amber-500 uppercase tracking-wide">Tip</p>
                    <p className="text-sm text-gray-500 mt-0.5 leading-relaxed">{tips[tipIndex]}</p>
                </div>
            </div>
        </div>
    );
}
