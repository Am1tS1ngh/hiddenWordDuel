import {
    WebSocketGateway,
    WebSocketServer,
    OnGatewayConnection,
    OnGatewayDisconnect,
    SubscribeMessage,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { GameService } from './game.service';

interface GameState {
    matchId: string;
    players: string[];
    word: string;
    revealedTiles: boolean[];
    roundNumber: number;
    roundId: string;
    scores: Record<string, number>;
    tickTimer: NodeJS.Timeout | null;
    tickActive: boolean;
    guessedThisTick: Set<string>;
    correctGuessThisTick: string | null;
    drawCheckTimer: NodeJS.Timeout | null;
    roundEnded: boolean;
}

@WebSocketGateway({
    cors: {
        origin: '*',
    },
})
export class GameGateway implements OnGatewayConnection, OnGatewayDisconnect {

    @WebSocketServer()
    server: Server;

    private waitingQueue: Socket[] = [];
    private activeGames: Map<string, GameState> = new Map();
    private playerToRoom: Map<string, string> = new Map();

    constructor(private gameService: GameService) { }

    async handleConnection(client: Socket) {
        console.log(`Connected: ${client.id}`);
        this.waitingQueue.push(client);
        client.emit('waitingForOpponent', { message: 'Looking for an opponent...' });

        if (this.waitingQueue.length >= 2) {
            const player1 = this.waitingQueue.shift()!;
            const player2 = this.waitingQueue.shift()!;
            await this.createMatch(player1, player2);
        }

        this.broadcastOnlineCount();
    }

    async handleDisconnect(client: Socket) {
        console.log(`Disconnected: ${client.id}`);
        this.waitingQueue = this.waitingQueue.filter(p => p.id !== client.id);

        this.broadcastOnlineCount();

        const roomName = this.playerToRoom.get(client.id);
        if (!roomName) return;

        const game = this.activeGames.get(roomName);
        if (!game) return;

        const opponentId = game.players.find(id => id !== client.id);
        if (opponentId) {
            this.server.to(opponentId).emit('opponentDisconnected', {
                message: 'Opponent disconnected. Waiting 10s for reconnect...',
            });
        }

        setTimeout(() => {
            const stillActive = this.activeGames.get(roomName);
            if (!stillActive) return;

            if (stillActive.tickTimer) clearInterval(stillActive.tickTimer);

            if (opponentId) {
                this.server.to(opponentId).emit('matchEnd', {
                    winner: opponentId,
                    finalScores: stillActive.scores,
                    reason: 'Opponent disconnected. You win!',
                });

            }

            this.activeGames.delete(roomName);
            stillActive.players.forEach(id => this.playerToRoom.delete(id));
        }, 10000);

    }

    private broadcastOnlineCount() {
        const count = this.server.engine.clientsCount;
        this.server.emit('onlineCount', { count });
    }


    private async createMatch(player1: Socket, player2: Socket) {
        const roomName = `match-${Date.now()}`;
        player1.join(roomName);
        player2.join(roomName);

        const match = await this.gameService.createMatch(player1.id, player2.id);

        const gameState: GameState = {
            matchId: match?.id || `mock-${Date.now()}`,
            players: [player1.id, player2.id],
            word: '',
            revealedTiles: [],
            roundNumber: 0,
            roundId: '',
            scores: { [player1.id]: 0, [player2.id]: 0 },
            tickTimer: null,
            tickActive: false,
            guessedThisTick: new Set(),
            correctGuessThisTick: null,
            drawCheckTimer: null,
            roundEnded: false,
        };

        this.activeGames.set(roomName, gameState);
        this.playerToRoom.set(player1.id, roomName);
        this.playerToRoom.set(player2.id, roomName);

        await this.startRound(roomName);
    }

    private async startRound(roomName: string, delayMs: number = 0) {
        const game = this.activeGames.get(roomName);
        if (!game) return;

        const startTime = Date.now();
        game.roundNumber += 1;

        // Pre-fetch the round data from the DB
        const { round, word, revealedTiles } = await this.gameService.createRound(
            game.matchId, game.roundNumber
        );

        // Calculate how much of the delay was eaten up by the DB query
        const elapsed = Date.now() - startTime;
        const remainingDelay = Math.max(0, delayMs - elapsed);

        setTimeout(() => {
            const stillActive = this.activeGames.get(roomName);
            if (!stillActive) return;

            stillActive.word = word;
            stillActive.revealedTiles = revealedTiles;
            stillActive.roundId = round.id;
            stillActive.guessedThisTick = new Set();
            stillActive.correctGuessThisTick = null;

            if (stillActive.drawCheckTimer) clearTimeout(stillActive.drawCheckTimer);
            stillActive.drawCheckTimer = null;
            stillActive.roundEnded = false;

            this.server.to(roomName).emit('startRound', {
                roundId: round.id,
                wordLength: word.length,
                roundNumber: stillActive.roundNumber,
            });

            this.startTick(roomName);
        }, remainingDelay);
    }

    private startTick(roomName: string) {
        const game = this.activeGames.get(roomName);
        if (!game) return;


        const TICK_DURATION = 10000;
        this.emitTickStart(roomName, game, TICK_DURATION);

        game.tickActive = true;

        game.tickTimer = setInterval(() => {
            game.tickActive = false;

            game.guessedThisTick = new Set();
            game.correctGuessThisTick = null;
            if (game.drawCheckTimer) {
                clearTimeout(game.drawCheckTimer);
                game.drawCheckTimer = null;
            }

            const randomIndex = this.gameService.getRandomHiddenIndex(game.revealedTiles);

            if (randomIndex === undefined) {
                clearInterval(game.tickTimer!);
                this.endRound(roomName, null);
                return;
            }

            game.revealedTiles[randomIndex] = true;

            this.server.to(roomName).emit('revealTile', {
                index: randomIndex,
                letter: game.word[randomIndex],
            });

            if (game.revealedTiles.every(t => t)) {
                clearInterval(game.tickTimer!);
                this.endRound(roomName, null);
                return;
            }

            this.emitTickStart(roomName, game, TICK_DURATION);
            game.tickActive = true;
        }, TICK_DURATION);
    }

    private emitTickStart(roomName: string, game: GameState, tickDuration: number) {
        const visibleWord = game.word
            .split('')
            .map((letter, i) => (game.revealedTiles[i] ? letter : '_'));

        this.server.to(roomName).emit('tickStart', {
            revealedTiles: game.revealedTiles,
            visibleWord,
            scores: game.scores,
            serverTime: Date.now(),
            tickDuration: tickDuration,
        });
    }

    @SubscribeMessage('submitGuess')
    async handleGuess(client: Socket, payload: { roundId: string; guessText: string }) {
        const roomName = this.playerToRoom.get(client.id);
        if (!roomName) return;

        const game = this.activeGames.get(roomName);
        if (!game) return;

        if (game.roundEnded) {
            client.emit('guessRejected', { reason: 'Round has ended.' });
            return;
        }


        if (!game.tickActive) {
            client.emit('guessRejected', { reason: 'Late submission.' });
            return;
        }

        if (game.guessedThisTick.has(client.id)) {
            client.emit('guessRejected', { reason: 'Already guessed this tick.' });
            return;
        }

        if (payload.roundId !== game.roundId) {
            client.emit('guessRejected', { reason: 'Invalid round.' });
            return;
        }

        game.guessedThisTick.add(client.id);
        const isCorrect = this.gameService.checkGuess(payload.guessText, game.word);

        this.gameService.saveGuess(game.roundId, client.id, payload.guessText, isCorrect);

        if (isCorrect) {
            // Edge Case: Check for simultaneous correct guesses (within a 200ms window)
            if (game.correctGuessThisTick) {
                // The opponent already guessed correctly milliseconds ago. It's a draw!
                if (game.drawCheckTimer) clearTimeout(game.drawCheckTimer);
                clearInterval(game.tickTimer!);
                this.endRound(roomName, null); // null winner = draw
            } else {
                // First player to guess correctly. Start a tiny 200ms grace period.
                game.correctGuessThisTick = client.id;
                game.drawCheckTimer = setTimeout(() => {
                    // If this runs, no one else answered correctly in time. This player wins.
                    clearInterval(game.tickTimer!);
                    this.endRound(roomName, client.id);
                }, 100);
            }
        } else {
            client.emit('guessResult', { correct: false });
        }

    }

    private async endRound(roomName: string, winnerId: string | null) {
        const game = this.activeGames.get(roomName);
        if (!game) return;

        // CRITICAL: Prevent duplicate endRound calls
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

        this.server.to(roomName).emit('roundEnd', {
            winner: winnerId,
            revealedWord: game.word,
            scores: game.scores,
            roundNumber: game.roundNumber,
        });

        // Fire and forget the DB save so it doesn't block the UI
        this.gameService.endRound(game.roundId, winnerId, game.revealedTiles).catch(console.error);

        if (this.gameService.isMatchOver(game.scores, game.roundNumber)) {
            await this.endMatch(roomName);
        } else {
            // Emit countdown to both players
            this.server.to(roomName).emit('roundCountdown', { seconds: 5 });
            // Let startRound handle the exact 5000ms delay while pre-fetching DB
            this.startRound(roomName, 5000);
        }
    }

    private async endMatch(roomName: string) {
        const game = this.activeGames.get(roomName);
        if (!game) return;

        const [p1, p2] = game.players;
        let matchWinner: string | null = null;
        if (game.scores[p1] > game.scores[p2]) matchWinner = p1;
        else if (game.scores[p2] > game.scores[p1]) matchWinner = p2;

        this.server.to(roomName).emit('matchEnd', {
            winner: matchWinner,
            finalScores: game.scores,
        });

        // Fire and forget the DB save
        this.gameService.endMatch(game.matchId, game.scores[p1], game.scores[p2]).catch(console.error);

        if (game.tickTimer) clearInterval(game.tickTimer);
        if (game.drawCheckTimer) clearTimeout(game.drawCheckTimer);
        this.activeGames.delete(roomName);
        game.players.forEach(id => this.playerToRoom.delete(id));
    }
}
