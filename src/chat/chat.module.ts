import { Module } from '@nestjs/common';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { DatabaseService } from '../database/database.service';

@Module({
  imports: [],
  controllers: [ChatController],
  providers: [ChatService, DatabaseService],
})
export class ChatModule { }
