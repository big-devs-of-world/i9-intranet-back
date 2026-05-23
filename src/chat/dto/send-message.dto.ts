import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class SendMessageDto {
  @ApiProperty({ description: 'ID do remetente' })
  @IsNotEmpty()
  @IsString()
  senderId: string;

  @ApiProperty({ description: 'Conteúdo da mensagem' })
  @IsNotEmpty()
  @IsString()
  content: string;
}