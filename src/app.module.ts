import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './user/user.module';
import { DatabaseService } from './database/database.service';

@Module({
  imports: [UserModule],
  controllers: [AppController],
  providers: [AppService, DatabaseService],
})
export class AppModule { }
