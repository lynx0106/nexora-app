import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ChatGateway } from './chat.gateway';
import { ChatService } from './chat.service';
import { Message } from './entities/message.entity';
import { TenantsModule } from '../tenants/tenants.module';
import { UsersModule } from '../users/users.module';
import { AiModule } from '../ai/ai.module';

import { ChatController } from './chat.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Message]),
    TenantsModule,
    UsersModule,
    AiModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'change-me',
      signOptions: { expiresIn: '1h' },
    }),
  ],
  providers: [ChatGateway, ChatService],
  controllers: [ChatController],
  exports: [ChatService, ChatGateway],
})
export class ChatModule {}
