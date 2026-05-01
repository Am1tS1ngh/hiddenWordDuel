import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { getRandomWord } from './words';

@Injectable()
export class GameService {
    private failedQueries: any[] = [];

    constructor(private prisma: PrismaService) { }

    private async executeWithRetry<T>(operation: () => Promise<T>, retries = 3): Promise<T | null> {
        for (let i = 0; i < retries; i++) {
            try {
                return await operation();
            } catch (error) {
                console.error(`DB write failed, retrying (${i + 1}/${retries})...`);
                await new Promise(res => setTimeout(res, 1000 * (i + 1))); // Exponential backoff
            }
        }
        console.error("DB write failed after retries. Falling back to in-memory to prevent crash.");
        this.failedQueries.push({ time: new Date(), operation: operation.toString() });
        return null;
    }

    async createMatch(player1Id: string, player2Id: string) {
        return this.executeWithRetry(async () =>
            await this.prisma.match.create({
                data: { player1Id, player2Id },
            }));
    }

    async createRound(matchId: string, roundNumber: number) {
        const word = getRandomWord();
        const revealedTiles = new Array(word.length).fill(false);
        const round = await this.executeWithRetry(async () =>
            await this.prisma.round.create({
                data: { matchId, word, revealedTiles, roundNumber },
            }));

        return {
            // Fallback to a mock round ID if DB completely failed
            round: round || { id: `mock-round-${Date.now()}` }, 
            word, 
            revealedTiles 
        };
    }

    checkGuess(guess: string, word: string): boolean {
        return guess.toLowerCase() === word.toLowerCase();
    }

    async saveGuess(roundId: string, playerId: string, guess: string, isCorrect: boolean) {
        return this.executeWithRetry(async () =>
            await this.prisma.guess.create({
                data: { roundId, playerId, guess, isCorrect },
            })
        );
    }

    getRandomHiddenIndex(revealedTiles: boolean[]): number {
        const hidden = revealedTiles
            .map((r, i) => (!r ? i : -1))
            .filter(i => i !== -1);
        return hidden[Math.floor(Math.random() * hidden.length)];
    }

    async endRound(roundId: string, winnerId: string | null, revealedTiles: boolean[]) {
        return this.executeWithRetry(async () =>
            await this.prisma.round.update({
                where: { id: roundId },
                data: { winnerId, endedAt: new Date(), revealedTiles },
            })
        );
    }

    isMatchOver(scores: Record<string, number>, roundNumber: number): boolean {
        const maxScore = Math.max(...Object.values(scores));
        return maxScore >= 3 || roundNumber >= 5;
    }

    async endMatch(matchId: string, score1: number, score2: number) {
        return this.executeWithRetry(async () =>
            await this.prisma.match.update({
                where: { id: matchId },
                data: { score1, score2, status: 'completed' },
            })
        );
    }
}
