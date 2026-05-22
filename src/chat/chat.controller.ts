import { Body, Controller, Delete, Get, Param, Post } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiParam, ApiBody } from "@nestjs/swagger";
import { ChatService } from "./chat.service";
import { CreateChatDto } from "./dto/create-chat.dto";
import { SendMessageDto } from "./dto/send-message.dto";
import { AddParticipantDto } from "./dto/add-participant.dto";
import { DeleteChatDto } from "./dto/delete-chat.dto";
import { RemoveParticipantDto } from "./dto/remove-participant.dto";

@ApiTags('Chat')
@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) { }

  @Post()
  @ApiOperation({ summary: 'Criar chat' })
  @ApiBody({ type: CreateChatDto })
  async createChat(@Body() createChatDto: CreateChatDto) {
    return this.chatService.createChat(createChatDto);
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Listar chats do usuário' })
  @ApiParam({ name: 'userId', type: String })
  async getChatsByUserId(@Param('userId') userId: string) {
    return this.chatService.getChatsByUserId(userId);
  }

  @Post(':chatId/message')
  @ApiOperation({ summary: 'Enviar mensagem no chat' })
  @ApiParam({ name: 'chatId', type: String })
  @ApiBody({ type: SendMessageDto })
  async sendMessage(
    @Param('chatId') chatId: string,
    @Body() sendMessageDto: SendMessageDto,
  ) {
    return this.chatService.sendMessage(chatId, sendMessageDto);
  }

  @Get(':chatId/messages')
  @ApiOperation({ summary: 'Listar mensagens do chat' })
  @ApiParam({ name: 'chatId', type: String })
  async getMessages(@Param('chatId') chatId: string) {
    return this.chatService.getMessages(chatId);
  }

  @Post(':chatId/participants')
  @ApiOperation({ summary: 'Adicionar participante' })
  @ApiParam({ name: 'chatId', type: String })
  @ApiBody({ type: AddParticipantDto })
  async addParticipant(
    @Param('chatId') chatId: string,
    @Body() addParticipantDto: AddParticipantDto,
  ) {
    return this.chatService.addParticipant(chatId, addParticipantDto.userId);
  }

  @Delete(':chatId/participants')
  @ApiOperation({ summary: 'Remover participante' })
  @ApiParam({ name: 'chatId', type: String })
  @ApiBody({ type: RemoveParticipantDto })
  async removeParticipant(
    @Param('chatId') chatId: string,
    @Body() removeParticipantDto: RemoveParticipantDto,
  ) {
    return this.chatService.removeParticipant(chatId, removeParticipantDto.userId);
  }

  @Delete(':chatId')
  @ApiOperation({ summary: 'Deletar chat' })
  @ApiParam({ name: 'chatId', type: String })
  @ApiBody({ type: DeleteChatDto })
  async deleteChat(
    @Param('chatId') chatId: string,
    @Body() deleteChatDto: DeleteChatDto,
  ) {
    return this.chatService.deleteChat(chatId, deleteChatDto.userId);
  }
}
