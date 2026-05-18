import { ArrayMinSize, IsArray, IsBoolean, IsString } from 'class-validator';

export class CreateChatDto {
  @IsString()
  name: string;

  @IsBoolean()
  isDM: boolean;

  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(2)
  participants: string[];
}
