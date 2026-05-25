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

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(private readonly chatService: ChatService) {}

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('joinChat')
  async handleJoinChat(
    @MessageBody() data: { chatId: string },
    @ConnectedSocket() client: Socket,
  ) {
    await client.join(`chat_${data.chatId}`);
    console.log(`Client ${client.id} joined chat: ${data.chatId}`);
    return { event: 'joined', data: data.chatId };
  }

  @SubscribeMessage('leaveChat')
  async handleLeaveChat(
    @MessageBody() data: { chatId: string },
    @ConnectedSocket() client: Socket,
  ) {
    await client.leave(`chat_${data.chatId}`);
    console.log(`Client ${client.id} left chat: ${data.chatId}`);
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
