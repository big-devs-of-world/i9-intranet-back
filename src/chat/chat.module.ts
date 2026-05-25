import { Module } from '@nestjs/common';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { DatabaseService } from '../database/database.service';
import { UserService } from '../user/user.service';
import { ChatGateway } from './chat.gateway';

@Module({
  imports: [],
  controllers: [ChatController],
  providers: [ChatService, DatabaseService, UserService, ChatGateway],
})
export class ChatModule {}
