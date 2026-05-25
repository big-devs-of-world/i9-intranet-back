import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class DeleteChatDto {
  @ApiProperty({ description: 'ID do usuário solicitando a exclusão' })
  @IsString()
  @IsNotEmpty()
  userId: string;
}
