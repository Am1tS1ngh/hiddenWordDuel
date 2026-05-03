import { Injectable } from '@nestjs/common';
import { Server } from 'socket.io';
import { GameService } from '../service/game.service';
import { GameState } from '../types/game.types';

const TICK_DURATION = 5000;
const DRAW_WINDOW = 100;

@Injectable()
export class GameEngine {
    constructor(private readonly gameService: GameService) { }

    /* ---------- ROUND START ---------- */
    async startRound(server: Server, roomName: string, game: GameState) {
        if (game.gameEnded) return;
        console.log(`🔄 ROUND START: match=${game.matchId} round=${game.roundNumber}`);
        game.roundNumber += 1;

        const { round, word, revealedTiles } =
            await this.gameService.createRound(game.matchId, game.roundNumber);

        game.word = word;
        game.revealedTiles = revealedTiles;
        game.roundId = round.id;
        game.guessedThisTick = new Set();
        game.firstCorrectGuessPlayerId = null;
        game.roundEnded = false;

        server.to(roomName).emit('startRound', {
            roundId: round.id,
            wordLength: word.length,
            roundNumber: game.roundNumber,
        });

        this.startTick(server, roomName, game);
    }

    /* ---------- TICK LOOP ---------- */
    startTick(server: Server, roomName: string, game: GameState) {
        if (game.gameEnded) return;

        this.emitTickStart(server, roomName, game);
        game.tickActive = true;

        game.tickTimer = setInterval(() => {
            game.tickActive = false;

            game.guessedThisTick.clear();
            game.firstCorrectGuessPlayerId = null;

            const index = this.gameService.getRandomHiddenIndex(
                game.revealedTiles
            );

            if (index === undefined) {
                this.endRound(server, roomName, game, null);
                return;
            }

            game.revealedTiles[index] = true;

            server.to(roomName).emit('revealTile', {
                index,
                letter: game.word[index],
            });

            if (game.revealedTiles.every((t) => t)) {
                this.endRound(server, roomName, game, null);
                return;
            }

            this.emitTickStart(server, roomName, game);
            game.tickActive = true;
        }, TICK_DURATION);
    }

    /* ---------- TICK START EMIT ---------- */
    emitTickStart(server: Server, roomName: string, game: GameState) {
        const visibleWord = game.word
            .split('')
            .map((l, i) => (game.revealedTiles[i] ? l : '_'));

        server.to(roomName).emit('tickStart', {
            revealedTiles: game.revealedTiles,
            visibleWord,
            scores: game.scores,
            serverTime: Date.now(),
            tickDuration: TICK_DURATION,
        });
    }

    /* ---------- GUESS HANDLING ---------- */
    handleGuess(
        server: Server,
        roomName: string,
        game: GameState,
        playerId: string,
        guessText: string
    ) {

        if (game.gameEnded) return;
        // console.log(`✏️ GUESS: player=${playerId} guess="${guessText}"`);

        if (game.roundEnded) {
            return { reject: 'Round has ended.' };
        }

        if (!game.tickActive) {
            return { reject: 'Late submission.' };
        }

        if (game.guessedThisTick.has(playerId)) {
            return { reject: 'Already guessed this tick.' };
        }

        game.guessedThisTick.add(playerId);

        const isCorrect = this.gameService.checkGuess(guessText, game.word);

        this.gameService.saveGuess(
            game.roundId,
            playerId,
            guessText,
            isCorrect
        );

        if (!isCorrect) {
            return { correct: false };
        }

        /* ---------- DRAW WINDOW HANDLING ---------- */
        if (game.firstCorrectGuessPlayerId) {
            if (game.drawCheckTimer) clearTimeout(game.drawCheckTimer);

            this.endRound(server, roomName, game, null);
        } else {
            game.firstCorrectGuessPlayerId = playerId;

            game.drawCheckTimer = setTimeout(() => {
                this.endRound(server, roomName, game, playerId);
            }, DRAW_WINDOW);
        }

        return { correct: true };
    }

    /* ---------- ROUND END ---------- */
    async endRound(
        server: Server,
        roomName: string,
        game: GameState,
        winnerId: string | null
    ) {

        if (game.gameEnded) return;

        if (game.roundEnded) return;

        game.roundEnded = true;

        if (game.tickTimer) {
            clearInterval(game.tickTimer);
            game.tickTimer = null;
        }

        if (game.drawCheckTimer) {
            clearTimeout(game.drawCheckTimer);
            game.drawCheckTimer = null;
        }

        game.tickActive = false;

        if (winnerId) {
            game.scores[winnerId] = (game.scores[winnerId] || 0) + 1;
        }
        
        // console.log(`🏁 ROUND END: winner=${winnerId} scores=`, game.scores);

        server.to(roomName).emit('roundEnd', {
            winner: winnerId,
            revealedWord: game.word,
            scores: game.scores,
            roundNumber: game.roundNumber,
        });

        // fire and forget DB save
        try {
            await this.gameService.endRound(
                game.roundId,
                winnerId,
                game.revealedTiles
            );
        } catch (err) {
            console.error('endRound failed:', err);
        }

        if (this.gameService.isMatchOver(game.scores, game.roundNumber)) {
            await this.endMatch(server, roomName, game);
        } else {
            if (game.gameEnded) return;
            server.to(roomName).emit('roundCountdown', { seconds: 5 });

            setTimeout(() => {
                if (game.gameEnded) return;
                this.startRound(server, roomName, game);
            }, 5000);
        }
    }

    /* ---------- MATCH END ---------- */
    async endMatch(server: Server, roomName: string, game: GameState) {
        const [p1, p2] = game.players;
        
        let winner: string | null = null;
        if (game.scores[p1] > game.scores[p2]) winner = p1;
        else if (game.scores[p2] > game.scores[p1]) winner = p2;
        
        // console.log(`🏆 MATCH END: winner=${winner} finalScores=`, game.scores);
        
        server.to(roomName).emit('matchEnd', {
            winner,
            finalScores: game.scores,
        });

        this.gameService
            .endMatch(game.matchId, game.scores[p1], game.scores[p2])
            .catch(console.error);
    }
}