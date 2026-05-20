import { Body, Controller, Delete, Get, Param, Post } from "@nestjs/common";
import { ChatService } from "./chat.service";
import { CreateChatDto } from "./dto/create-chat.dto";
import { SendMessageDto } from "./dto/send-message.dto";
import { AddParticipantDto } from "./dto/add-participant.dto";
import { DeleteChatDto } from "./dto/delete-chat.dto";
import { RemoveParticipantDto } from "./dto/remove-participant.dto";

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) { }

  @Post()
  async createChat(@Body() createChatDto: CreateChatDto) {
    return this.chatService.createChat(createChatDto);
  }

  @Get('user/:userId')
  async getChatsByUserId(@Param('userId') userId: string) {
    return this.chatService.getChatsByUserId(userId);
  }

  @Post(':chatId/message')
  async sendMessage(
    @Param('chatId') chatId: string,
    @Body() sendMessageDto: SendMessageDto,
  ) {
    return this.chatService.sendMessage(chatId, sendMessageDto);
  }

  @Get(':chatId/messages')
  async getMessages(@Param('chatId') chatId: string) {
    return this.chatService.getMessages(chatId);
  }

  @Post(':chatId/participants')
  async addParticipant(
    @Param('chatId') chatId: string,
    @Body() addParticipantDto: AddParticipantDto,
  ) {
    return this.chatService.addParticipant(chatId, addParticipantDto.userId);
  }

  @Delete(':chatId/participants')
  async removeParticipant(
    @Param('chatId') chatId: string,
    @Body() removeParticipantDto: RemoveParticipantDto,
  ) {
    return this.chatService.removeParticipant(chatId, removeParticipantDto.userId);
  }

  @Delete(':chatId')
  async deleteChat(
    @Param('chatId') chatId: string,
    @Body() deleteChatDto: DeleteChatDto,
  ) {
    return this.chatService.deleteChat(chatId, deleteChatDto.userId);
  }
}