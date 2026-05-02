"use client";

interface ScoreboardProps {
  scores: Record<string, number>;
  myPlayerId: string;
}

export default function Scoreboard({ scores, myPlayerId }: ScoreboardProps) {
  const players = Object.keys(scores);
  const myScore = scores[myPlayerId] ?? 0;
  const opponentId = players.find((id) => id !== myPlayerId) || "Opponent";
  const opponentScore = scores[opponentId] ?? 0;

  return (
    <div className="relative w-full max-w-[320px] mx-auto flex items-center justify-between bg-white rounded-[2rem] shadow-[0_4px_24px_rgb(0,0,0,0.03)] px-6 py-3 border border-[#f0eef5]">
      
      {/* YOU Side */}
      <div className="flex flex-col items-center flex-1">
        <span className="text-[10px] text-indigo-600 font-bold uppercase tracking-widest mb-0.5">You</span>
        <span className="text-3xl font-black text-indigo-700">{myScore}</span>
      </div>

      {/* VS Separator */}
      <div className="flex items-center justify-center shrink-0 w-16 relative">
         <div className="absolute w-full h-[1px] bg-gray-100"></div>
         <span className="relative bg-white px-2 text-[10px] font-bold text-gray-300 tracking-widest">VS</span>
      </div>

      {/* OPPONENT Side */}
      <div className="flex flex-col items-center flex-1">
        <span className="text-[10px] text-rose-500 font-bold uppercase tracking-widest mb-0.5">Opponent</span>
        <span className="text-3xl font-black text-rose-600">{opponentScore}</span>
      </div>

    </div>
  );
}
