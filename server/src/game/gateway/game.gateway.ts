import {
    WebSocketGateway,
    WebSocketServer,
    OnGatewayConnection,
    OnGatewayDisconnect,
    SubscribeMessage,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { GameService } from '../service/game.service';
import { GameEngine } from '../engine/game.engine';
import { GameState } from '../types/game.types';

@WebSocketGateway({
    // do NOT hardcode a port here
    cors: {
        origin: process.env.FRONTEND_URL || '*',
        methods: ['GET', 'POST'],
        credentials: true,
    },
    // Railway proxy needs polling to handshake before upgrading
    transports: ['polling', 'websocket'],

})
export class GameGateway
    implements OnGatewayConnection, OnGatewayDisconnect {

    @WebSocketServer()
    server: Server;

    private waitingQueue: Socket[] = [];
    private socketToPlayer = new Map<string, string>();
    private activeGames = new Map<string, GameState>();
    private playerToRoom = new Map<string, string>();

    constructor(
        private readonly gameService: GameService,
        private readonly gameEngine: GameEngine,
    ) { }

    /* ---------- CONNECTION ---------- */
    async handleConnection(client: Socket) {
        try {
            client.emit('requestRegister');
            this.broadcastOnlineCount();
        } catch (err) {
            console.error('handleConnection error:', err);
        }
    }

    /* ---------- REGISTER PLAYER ---------- */
    @SubscribeMessage('registerPlayer')
    async registerPlayer(client: Socket, payload: { username: string }) {
        // an unhandled promise rejection here causes silent failures
        try {
            if (!payload?.username?.trim()) {
                client.emit('error', { message: 'Username is required' });
                return;
            }

            const player = await this.gameService.upsertPlayer(payload.username);
            this.socketToPlayer.set(client.id, player.id);

            client.emit('playerRegistered', { playerId: player.id });

            // client may have disconnected while awaiting upsertPlayer
            if (!client.connected) return;

            const alreadyQueued = this.waitingQueue.some(s => s.id === client.id);
            if (alreadyQueued) return;

            this.waitingQueue.push(client);
            client.emit('waitingForOpponent', {
                message: 'Looking for an opponent...',
            });

            if (this.waitingQueue.length >= 2) {
                const p1 = this.waitingQueue.shift()!;
                const p2 = this.waitingQueue.shift()!;

                if (!p1.connected || !p2.connected) {
                    // re-queue the one still connected
                    if (p1.connected) this.waitingQueue.unshift(p1);
                    if (p2.connected) this.waitingQueue.unshift(p2);
                    return;
                }

                await this.createMatch(p1, p2);
            }
        } catch (err) {
            console.error('registerPlayer error:', err);
            client.emit('error', { message: 'Failed to register. Please retry.' });
        }
    }

    /* ---------- DISCONNECT ---------- */
    async handleDisconnect(client: Socket) {
        try {
            this.waitingQueue = this.waitingQueue.filter(p => p.id !== client.id);
            this.broadcastOnlineCount();

            const playerId = this.socketToPlayer.get(client.id);
            if (!playerId) {
                // socket never registered — just clean up
                this.socketToPlayer.delete(client.id);
                return;
            }

            const room = this.playerToRoom.get(playerId);
            if (!room) {
                this.socketToPlayer.delete(client.id);
                return;
            }

            const game = this.activeGames.get(room);
            if (!game || game.gameEnded) {
                this.socketToPlayer.delete(client.id);
                return;
            }

            // find opponent
            const opponentId = game.players.find(id => id !== playerId);
            if (!opponentId) return;

            // find opponent's socket id
            const opponentSocketId = [...this.socketToPlayer.entries()]
                .find(([, pId]) => pId === opponentId)?.[0];

            if (opponentSocketId) {
                this.server.to(opponentSocketId).emit('opponentDisconnected', {
                    message: 'Opponent disconnected. You win!',
                });
            }

            // grace period then award win
            setTimeout(() => {
                const stillActive = this.activeGames.get(room);
                if (!stillActive || stillActive.gameEnded) return;

                stillActive.gameEnded = true;

                if (stillActive.tickTimer) clearInterval(stillActive.tickTimer);
                if (stillActive.drawCheckTimer) clearTimeout(stillActive.drawCheckTimer);
                console.log("Winner:", opponentId);
                console.log("Final Scores:", stillActive.scores);
                this.server.to(room).emit('matchEnd', {
                    winner: opponentId,
                    finalScores: stillActive.scores,
                    reason: 'Opponent Disconnected',
                });

                this.cleanupGame(room, stillActive);

            }, 3000);

        } catch (err) {
            console.error('handleDisconnect error:', err);
        }
    }

    /* ---------- GUESS ---------- */
    @SubscribeMessage('submitGuess')
    handleGuess(
        client: Socket,
        payload: { roundId: string; guessText: string },
    ) {
        try {
            const playerId = this.socketToPlayer.get(client.id);
            if (!playerId) {
                client.emit('guessRejected', { reason: 'Not registered.' });
                return;
            }

            const room = this.playerToRoom.get(playerId);
            if (!room) {
                client.emit('guessRejected', { reason: 'Not in a match.' });
                return;
            }

            const game = this.activeGames.get(room);
            if (!game || game.gameEnded) {
                client.emit('guessRejected', { reason: 'Game not active.' });
                return;
            }

            if (!game.tickActive) {
                client.emit('guessRejected', { reason: 'late_submission' });
                return;
            }

            if (payload.roundId !== game.roundId) {
                client.emit('guessRejected', { reason: 'invalid_round' });
                return;
            }

            const result = this.gameEngine.handleGuess(
                this.server,
                room,
                game,
                playerId,
                payload.guessText,
            );

            if (result?.reject) {
                client.emit('guessRejected', { reason: result.reject });
            } else {
                client.emit('guessResult', result);
            }

        } catch (err) {
            console.error('handleGuess error:', err);
        }
    }

    /* ---------- ONLINE COUNT ---------- */
    private broadcastOnlineCount() {
        if (!this.server?.engine) return;
        const count = this.server.engine.clientsCount;
        this.server.emit('onlineCount', { count });
    }

    /* ---------- MATCH CREATION ---------- */
    private async createMatch(p1: Socket, p2: Socket) {
        try {
            const player1Id = this.socketToPlayer.get(p1.id)!;
            const player2Id = this.socketToPlayer.get(p2.id)!;

            const match = await this.gameService.createMatch(player1Id, player2Id);
            console.log(`🎮 MATCH CREATED`);
            console.log(`Players: ${player1Id} vs ${player2Id}`);


            const room = `match-${match?.id || Date.now()}`;

            p1.join(room);
            p2.join(room);

            const game: GameState = {
                matchId: match?.id || `mock-${Date.now()}`,
                players: [player1Id, player2Id],
                word: '',
                revealedTiles: [],
                roundNumber: 0,
                roundId: '',
                scores: { [player1Id]: 0, [player2Id]: 0 },
                tickTimer: null,
                tickActive: false,
                guessedThisTick: new Set(),
                firstCorrectGuessPlayerId: null,
                drawCheckTimer: null,
                roundEnded: false,
                gameEnded: false,
            };

            this.activeGames.set(room, game);
            this.playerToRoom.set(player1Id, room);
            this.playerToRoom.set(player2Id, room);

            await this.gameEngine.startRound(this.server, room, game);

        } catch (err) {
            console.error('createMatch error:', err);
            // notify both players something went wrong
            p1.emit('error', { message: 'Failed to create match. Please rejoin.' });
            p2.emit('error', { message: 'Failed to create match. Please rejoin.' });
        }
    }

    /* ---------- CLEANUP HELPER ---------- */
    private cleanupGame(room: string, game: GameState) {
        if (game.tickTimer) clearInterval(game.tickTimer);
        if (game.drawCheckTimer) clearTimeout(game.drawCheckTimer);

        this.activeGames.delete(room);
        game.players.forEach(id => {
            this.playerToRoom.delete(id);
        });

        // clean up socket→player entries for players in this game
        [...this.socketToPlayer.entries()].forEach(([sockId, playerId]) => {
            if (game.players.includes(playerId)) {
                this.socketToPlayer.delete(sockId);
            }
        });
    }
}