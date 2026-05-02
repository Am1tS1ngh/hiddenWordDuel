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
    cors: { origin: '*' },
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
        client.emit("requestRegister"); // only ask for identity
        this.broadcastOnlineCount();
        // console.log(`🟢 CONNECTED: socket=${client.id}`);
    }

    @SubscribeMessage("registerPlayer")
    async registerPlayer(client: Socket, payload: { username: string }) {
        const player = await this.gameService.upsertPlayer(payload.username);

        this.socketToPlayer.set(client.id, player.id);

        client.emit("playerRegistered", {
            playerId: player.id,
        });
        // console.log(`👤 REGISTERED: socket=${client.id} → player=${player.id} (${payload.username})`);

        // NOW matchmaking starts
        this.waitingQueue.push(client);

        // console.log(`⏳ QUEUE: ${this.waitingQueue.length} players waiting`);

        client.emit("waitingForOpponent", {
            message: "Looking for an opponent...",
        });

        if (this.waitingQueue.length >= 2) {
            const p1 = this.waitingQueue.shift()!;
            const p2 = this.waitingQueue.shift()!;
            await this.createMatch(p1, p2);
        }
    }

    /* ---------- DISCONNECT ---------- */
    async handleDisconnect(client: Socket) {
        this.waitingQueue = this.waitingQueue.filter(p => p.id !== client.id);
        this.broadcastOnlineCount();

        // console.log(`🔴 DISCONNECTED: socket=${client.id}`);

        const playerId = this.socketToPlayer.get(client.id);
        if (!playerId) return;

        const room = this.playerToRoom.get(playerId);
        if (!room) return;

        const game = this.activeGames.get(room);
        if (!game) return;

        const opponentId = game.players.find(id => id !== playerId);

        const opponentSocket = [...this.socketToPlayer.entries()]
            .find(([sockId, pId]) => pId === opponentId)?.[0];

        if (opponentSocket) {
            this.server.to(opponentSocket).emit('opponentDisconnected', {
                message: 'Opponent disconnected. You win!',
            });
        }

        // ⏱️ optional delay (you can reduce to 2–3 sec or remove)
        setTimeout(() => {
            const stillActive = this.activeGames.get(room);
            if (!stillActive) return;

            // console.log(`⚡ AUTO WIN: winner=${opponentId}`);

            // STOP GAME
            stillActive.gameEnded = true;

            if (stillActive.tickTimer) clearInterval(stillActive.tickTimer);
            if (stillActive.drawCheckTimer) clearTimeout(stillActive.drawCheckTimer);

            // END MATCH
            this.server.to(room).emit('matchEnd', {
                winner: opponentId,
                finalScores: stillActive.scores,
                reason: 'Opponent disconnected',
            });

            // CLEANUP
            this.activeGames.delete(room);
            this.socketToPlayer.delete(client.id);
            stillActive.players.forEach(id => this.playerToRoom.delete(id));

        }, 3000); // or 0 if you want instant
    }
    /* ---------- ONLINE COUNT ---------- */
    private broadcastOnlineCount() {
        const count = this.server.engine.clientsCount;
        this.server.emit('onlineCount', { count });
    }

    /* ---------- MATCH CREATION ---------- */
    private async createMatch(p1: Socket, p2: Socket) {
        const player1Id = this.socketToPlayer.get(p1.id)!;
        const player2Id = this.socketToPlayer.get(p2.id)!;

        const match = await this.gameService.createMatch(player1Id, player2Id);

        const room = `match-${Date.now()}`;

        console.log(`🎮 MATCH CREATED: room=${room}`);
        console.log(`   players: ${player1Id} vs ${player2Id}`);

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

        // console.log(`🧠 GAME STATE INIT:`, game);

        await this.gameEngine.startRound(this.server, room, game);

    }

    /* ---------- GUESS HANDLING ---------- */
    @SubscribeMessage('submitGuess')
    handleGuess(
        client: Socket,
        payload: { roundId: string; guessText: string },
    ) {
        const playerId = this.socketToPlayer.get(client.id);
        if (!playerId) return;

        const room = this.playerToRoom.get(playerId);
        if (!room) return;

        const game = this.activeGames.get(room);
        if (!game) return;

        if (payload.roundId !== game.roundId) {
            client.emit('guessRejected', { reason: 'Invalid round.' });
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
    }
}