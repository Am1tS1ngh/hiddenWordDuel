export interface GameState {
    matchId: string;

    // Players
    players: string[];

    // Word + Reveal
    word: string;
    revealedTiles: boolean[];

    // Round Info
    roundNumber: number;
    roundId: string;

    // Scores
    scores: Record<string, number>;

    // Tick Control
    tickTimer: NodeJS.Timeout | null;
    tickActive: boolean;

    // Guess Tracking (per tick)
    guessedThisTick: Set<string>;
    firstCorrectGuessPlayerId: string | null;

    // Draw Handling
    drawCheckTimer: NodeJS.Timeout | null;

    // Round State
    roundEnded: boolean;

    //Game End
    gameEnded: boolean;
}