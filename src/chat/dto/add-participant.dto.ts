import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class AddParticipantDto {
  @ApiProperty({ description: 'ID do usuário a ser adicionado' })
  @IsString()
  @IsNotEmpty()
  userId: string;
}
