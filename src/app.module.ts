import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DriveController, CalendarController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './user/user.module';
import { ChatModule } from './chat/chat.module';
import { DatabaseService } from './database/database.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    UserModule,
    ChatModule
  ],
  controllers: [DriveController, CalendarController],
  providers: [AppService, DatabaseService],
})
export class AppModule { }
