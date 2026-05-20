import { BadRequestException, ConflictException, ForbiddenException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CreateChatDto } from './dto/create-chat.dto';
import { SendMessageDto } from './dto/send-message.dto';

@Injectable()
export class ChatService {
  private readonly chatsCollection = 'chats';
  private readonly messagesCollection = 'messages';

  constructor(private readonly databaseService: DatabaseService) { }

  /**
   * Função privado para verificar a existência de um usuário.
   * futuramente fazer esta lógica dentro do user.service.ts (confirmar se esta é a melhor prática)
   */
  private async checkUserExists(userId: string): Promise<any> {
    try {
      return await this.databaseService.getDoc('users', userId);
    } catch {
      throw new NotFoundException(`Usuário com ID '${userId}' não encontrado`);
    }
  }

  /**
   * Função privado para verificar a existência de um chat.
   */
  private async checkChatExists(chatId: string): Promise<any> {
    try {
      return await this.databaseService.getDoc(this.chatsCollection, chatId);
    } catch {
      throw new NotFoundException(`Chat com ID '${chatId}' não encontrado`);
    }
  }

  /**
   * Cria um novo chat no banco de dados.
   * Verifica a existência de todos os participantes antes de criar.
   * ┐( ˘_˘ )┌
   * 
   * @param createChatDto Dados para criação do chat.
   * @returns O documento do chat criado.
   */
  async createChat(createChatDto: CreateChatDto) {
    try {
      // Verifica se todos os participantes existem no banco de dados
      await Promise.all(
        createChatDto.participants.map((userId: string) => this.checkUserExists(userId))
      );

      const data = {
        name: createChatDto.name,
        isDM: createChatDto.isDM ?? false,
        participants: createChatDto.participants,
        createdAt: new Date().toISOString(),
        lastMessage: null,
        lastMessageAt: null,
      };

      const chat = await this.databaseService.setNewDoc(this.chatsCollection, data);
      return chat;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to create chat');
    }
  }

  /**
   * Retorna todos os chats em que um usuário específico é participante.
   * FUTURO: Futuramente, obter o userId a partir do token de autenticação (auth) em vez do parâmetro.
   * (づ ￣ ³￣ )づ
   * 
   * @param userId ID do usuário.
   * @returns Lista de chats do usuário.
   */
  async getChatsByUserId(userId: string) {
    try {
      const chats = await this.databaseService.getDocsByQuery(this.chatsCollection, 'participants', 'array-contains', userId);
      return chats;
    } catch (error) {
      throw new InternalServerErrorException('Failed to get chats');
    }
  }

  /**
   * Envia uma mensagem em um chat existente.
   * Valida a existência do chat e se o remetente é participante do mesmo.
   * FUTURO: Futuramente, obter o senderId a partir do token de autenticação (auth).
   * ༼ つ ◕_◕ ༽つ
   * 
   * @param chatId ID do chat.
   * @param sendMessageDto Dados da mensagem.
   * @returns Dados da mensagem enviada e seu ID.
   */
  async sendMessage(chatId: string, sendMessageDto: SendMessageDto) {
    try {
      const chatDoc = await this.checkChatExists(chatId);

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

      const messageId = await this.databaseService.setNewDoc(this.messagesCollection, messageData);

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

  /**
   * Recupera as mensagens de um chat, incluindo dados básicos de cada remetente.
   * FUTURO: Implementar verificação de autorização para garantir que quem solicita é participante.
   * ┐( ˘_˘ )┌
   * 
   * @param chatId ID do chat.
   * @returns Lista de mensagens enriquecidas com dados do remetente.
   */
  async getMessages(chatId: string) {
    try {
      await this.checkChatExists(chatId);

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
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to get messages');
    }
  }

  /**
   * Adiciona um novo participante a um chat em grupo existente.
   * Valida a existência do usuário, do chat, e se não é uma conversa direta (DM).
   * FUTURO: Implementar verificação de autorização de quem enviou a requisição.
   * (ง ื▿ ื)ว
   * 
   * @param chatId ID do chat.
   * @param userId ID do usuário a ser adicionado.
   * @returns Objeto contendo a mensagem de sucesso e a lista atualizada de participantes.
   */
  async addParticipant(chatId: string, userId: string) {
    try {
      await this.checkUserExists(userId);
      const chatDoc = await this.checkChatExists(chatId);

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

  /**
   * Remove um participante de um chat em grupo.
   * Valida a existência do usuário, do chat, e se a conversa não é direta (DM).
   * FUTURO: Implementar verificação de autorização de quem enviou a requisição.
   * ¯\_(ツ)_/¯
   * 
   * @param chatId ID do chat.
   * @param userId ID do usuário a ser removido.
   * @returns Objeto contendo a mensagem de sucesso e a lista atualizada de participantes.
   */
  async removeParticipant(chatId: string, userId: string) {
    try {
      await this.checkUserExists(userId);
      const chatDoc = await this.checkChatExists(chatId);

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

  /**
   * Exclui um chat em grupo existente.
   * Valida se o usuário solicitante existe e é participante do chat. Não permite exclusão de DM.
   * FUTURO: Obter o userId via autenticação em vez do body (atualmente inseguro).
   * (╯°□°）╯︵ ┻━┻ 
   * 
   * @param chatId ID do chat.
   * @param userId ID do usuário que está solicitando a exclusão.
   * @returns Objeto com a mensagem de sucesso.
   */
  async deleteChat(chatId: string, userId: string) {
    try {
      await this.checkUserExists(userId);
      const chatDoc = await this.checkChatExists(chatId);

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