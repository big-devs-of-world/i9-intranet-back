import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';
import { SendMessageDto } from './dto/send-message.dto';
import { ConflictException, BadRequestException } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(private readonly chatService: ChatService) { }

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('joinChat')
  async handleJoinChat(
    @MessageBody() data: { chatId: string; userId: string },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      await this.chatService.addParticipant(data.chatId, data.userId);
    } catch (error) {
      // Ignora se o usuário já estiver no chat ou se for uma DM (onde não se adiciona participantes via este método)
      if (
        !(error instanceof ConflictException) &&
        !(error.status === 403) // Forbidden pra DM
      ) {
        console.error(`Error adding participant to DB: ${error.message}`);
      }
    }

    await client.join(`chat_${data.chatId}`);
    console.log(`Client ${client.id} (User: ${data.userId}) joined room: chat_${data.chatId}`);

    // Notifica outros participantes
    this.server.to(`chat_${data.chatId}`).emit('participantJoined', { userId: data.userId });

    return { event: 'joined', data: data.chatId };
  }

  @SubscribeMessage('leaveChat')
  async handleLeaveChat(
    @MessageBody() data: { chatId: string; userId: string },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      await this.chatService.removeParticipant(data.chatId, data.userId);
    } catch (error) {
      // Ignora se o usuário não estiver no chat ou se for uma DM
      if (
        !(error instanceof BadRequestException) &&
        !(error.status === 403) // Forbidden for DM
      ) {
        console.error(`Error removing participant from DB: ${error.message}`);
      }
    }

    await client.leave(`chat_${data.chatId}`);
    console.log(`Client ${client.id} (User: ${data.userId}) left room: chat_${data.chatId}`);

    // Notifica outros participantes
    this.server.to(`chat_${data.chatId}`).emit('participantLeft', { userId: data.userId });

    return { event: 'left', data: data.chatId };
  }

  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    @MessageBody() data: { chatId: string; sendMessageDto: SendMessageDto },
  ) {
    // 1. Persistir no Firestore (1 write)
    const savedMessage = await this.chatService.sendMessage(
      data.chatId,
      data.sendMessageDto,
    );

    // 2. Emitir para todos no "room" (0 reads do Firestore)
    // Usamos o room 'chat_ID' para garantir que apenas os participantes recebam
    this.server.to(`chat_${data.chatId}`).emit('newMessage', savedMessage);

    return savedMessage;
  }
}
