import { BadRequestException, ConflictException, ForbiddenException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CreateChatDto } from './dto/create-chat.dto';
import { SendMessageDto } from './dto/send-message.dto';

@Injectable()
export class ChatService {
  private readonly chatsCollection = 'chats';
  private readonly messagesCollection = 'messages';

  constructor(private readonly databaseService: DatabaseService) { }

  // Função para criar um chat
  // ┐( ˘_˘ )┌
  async createChat(createChatDto: CreateChatDto) {
    try {
      // Verifica se todos os participantes existem no banco de dados
      await Promise.all(
        createChatDto.participants.map(async (userId: string) => {
          try {
            await this.databaseService.getDoc('users', userId);
          } catch {
            throw new NotFoundException(`Usuário com ID '${userId}' não encontrado`);
          }
        })
      );

      const data = {
        name: createChatDto.name,
        isDM: createChatDto.isDM,
        participants: createChatDto.participants,
        createdAt: new Date().toISOString(),
        lastMessage: null,
        lastMessageAt: null,
      };

      const chatId = await this.databaseService.createDoc(this.chatsCollection, data);
      return { id: chatId, ...data };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to create chat');
    }
  }

  // função para pegar os chats de um usuário específico
  // se no futuro tiver auth, pegar userId do auth
  // por enquanto ela recebe o userId no parametro do get (que não é muito confiavel)
  // (づ ￣ ³￣ )づ
  async getChatsByUserId(userId: string) {
    try {
      const chats = await this.databaseService.getDocsByQuery(this.chatsCollection, 'participants', 'array-contains', userId);
      return chats;
    } catch (error) {
      throw new InternalServerErrorException('Failed to get chats');
    }
  }

  // função para enviar uma mensagem em um chat
  // verifica se o chat existe e se o senderId (remetente da mensagem) é de um dos participantes do chat
  // se no futuro tiver auth, utilizar o usuário logado como senderId
  // por enquanto ela recebe o senderId no body do post (que não é muito confiavel)
  // ༼ つ ◕_◕ ༽つ
  async sendMessage(chatId: string, sendMessageDto: SendMessageDto) {
    try {
      // Verifica se o chat existe
      const chatDoc: any = await this.databaseService.getDoc(this.chatsCollection, chatId);

      // Verifica se o usuário é um dos participantes do chat
      const participants = chatDoc.data?.participants || [];
      if (!participants.includes(sendMessageDto.senderId)) {
        throw new ForbiddenException(`User with ID ${sendMessageDto.senderId} is not a participant in chat ${chatId}`);
      }

      const timestamp = new Date().toISOString();
      const messageData = {
        chatId,
        senderId: sendMessageDto.senderId,
        content: sendMessageDto.content,
        createdAt: timestamp,
      };

      const messageId = await this.databaseService.createDoc(this.messagesCollection, messageData);

      // Atualiza o lastMessage do chat
      await this.databaseService.updateDoc(this.chatsCollection, chatId, {
        lastMessage: sendMessageDto.content,
        lastMessageAt: timestamp,
      });

      return { id: messageId, ...messageData };
    } catch (error) {
      if (error instanceof ForbiddenException || error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to send message');
    }
  }

  // função para pegar as mensagens de um chat, com os dados do remetente de cada mensagem
  // se no futuro tiver auth, verificar se o usuário logado é um participante do chat
  // por enquanto ela recebe o chatId no parâmetro da rota, e não faz verificação nenhuma quanto quem está pedindo (inseguro)
  // ┐( ˘_˘ )┌
  async getMessages(chatId: string) {
    try {
      const messages = await this.databaseService.getDocsByQuery(
        this.messagesCollection,
        'chatId',
        '==',
        chatId,
        'createdAt'
      );

      // Adiciona o remetente (sender) nas mensagens
      const enrichedMessages = await Promise.all(
        messages.map(async (message: { id: string; data: any }) => {
          try {
            const userDoc: any = await this.databaseService.getDoc('users', message.data.senderId);
            return {
              ...message,
              sender: {
                name: userDoc?.data?.name ?? null,
                email: userDoc?.data?.email ?? null,
              },
            };
          } catch {
            return { ...message, sender: null };
          }
        })
      );

      return enrichedMessages;
    } catch (error) {
      throw new InternalServerErrorException('Failed to get messages');
    }
  }

  // Função para adicionar um participante ao chat
  // Função verifica se o usuário a ser adicionado existe, se o chat existe e se o usuário já não é participante do chat
  // Rota sem nenhuma verificação quanto a quem a envio (inseguro)
  // (ง ื▿ ื)ว
  async addParticipant(chatId: string, userId: string) {
    try {
      try {
        await this.databaseService.getDoc('users', userId);
      } catch {
        throw new NotFoundException(`Usuário com ID '${userId}' não encontrado`);
      }

      let chatDoc: any;
      try {
        chatDoc = await this.databaseService.getDoc(this.chatsCollection, chatId);
      } catch {
        throw new NotFoundException(`Chat com ID '${chatId}' não encontrado`);
      }

      if (chatDoc.data?.isDM) {
        throw new ForbiddenException(`Não é possível adicionar participantes em uma conversa direta (DM)`);
      }

      const participants: string[] = chatDoc.data?.participants || [];
      if (participants.includes(userId)) {
        throw new ConflictException(`Usuário com ID '${userId}' já é participante do chat '${chatId}'`);
      }

      const updatedParticipants = [...participants, userId];
      await this.databaseService.updateDoc(this.chatsCollection, chatId, {
        participants: updatedParticipants,
      });

      return {
        message: `Usuário '${userId}' adicionado ao chat '${chatId}' com sucesso`,
        chatId,
        participants: updatedParticipants,
      };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ConflictException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to add participant to chat');
    }
  }

  // Função para remover um participante de um chat
  // Verifica se o usuário existe, se o chat existe e se o usuário é de fato participante antes de remover
  // Rota sem verificação de quem enviou a requisição (inseguro)
  // ¯\_(ツ)_/¯
  async removeParticipant(chatId: string, userId: string) {
    try {
      try {
        await this.databaseService.getDoc('users', userId);
      } catch {
        throw new NotFoundException(`Usuário com ID '${userId}' não encontrado`);
      }

      let chatDoc: any;
      try {
        chatDoc = await this.databaseService.getDoc(this.chatsCollection, chatId);
      } catch {
        throw new NotFoundException(`Chat com ID '${chatId}' não encontrado`);
      }

      if (chatDoc.data?.isDM) {
        throw new ForbiddenException(`Não é possível remover participantes de uma conversa direta (DM)`);
      }

      const participants: string[] = chatDoc.data?.participants || [];
      if (!participants.includes(userId)) {
        throw new BadRequestException(`Usuário com ID '${userId}' não é participante do chat '${chatId}'`);
      }

      const updatedParticipants = participants.filter((id) => id !== userId);
      await this.databaseService.updateDoc(this.chatsCollection, chatId, {
        participants: updatedParticipants,
      });

      return {
        message: `Usuário '${userId}' removido do chat '${chatId}' com sucesso`,
        chatId,
        participants: updatedParticipants,
      };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to remove participant from chat');
    }
  }

  // Função para deletar um chat específico
  // estou pedindo um userId no body do delete, e verificando se ele é participante do chat para deletar
  // porém o body pode ser alterado da forma que quiser (inseguro)
  // (╯°□°）╯︵ ┻━┻ 
  async deleteChat(chatId: string, userId: string) {
    try {
      // Verifica se o usuário existe no banco de dados
      try {
        await this.databaseService.getDoc('users', userId);
      } catch {
        throw new NotFoundException(`Usuário com ID '${userId}' não encontrado`);
      }

      let chatDoc: any;
      try {
        chatDoc = await this.databaseService.getDoc(this.chatsCollection, chatId);
      } catch {
        throw new NotFoundException(`Chat com ID '${chatId}' não encontrado`);
      }

      if (chatDoc.data?.isDM) {
        throw new ForbiddenException(`Não é possível excluir uma conversa direta (DM)`);
      }

      const participants: string[] = chatDoc.data?.participants || [];
      if (!participants.includes(userId)) {
        throw new ForbiddenException(`Usuário com ID '${userId}' não é membro do chat '${chatId}'`);
      }

      await this.databaseService.delDoc(this.chatsCollection, chatId);

      return { message: `Chat '${chatId}' deletado com sucesso` };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to delete chat');
    }
  }
}