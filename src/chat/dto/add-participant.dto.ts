import { IsString } from 'class-validator';

export class AddParticipantDto {
  @IsString()
  userId: string;
}
