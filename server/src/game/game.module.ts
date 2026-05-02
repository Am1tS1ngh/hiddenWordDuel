import { Module } from '@nestjs/common';
import { GameGateway } from './gateway/game.gateway';
import { GameService } from './service/game.service';
import { GameEngine } from './engine/game.engine';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  providers: [
    GameGateway,
    GameService,
    GameEngine,
    PrismaService,
  ],
})
export class GameModule {}