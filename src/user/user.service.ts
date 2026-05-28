import {
  BadRequestException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { OAuth2Client } from 'google-auth-library';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { initDB } from '../database/connection.database';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginGoogleDto } from './dto/login-google.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { DatabaseService } from '../database/database.service';

type UserData = {
  name: string;
  email: string;
  role: string;
  provider?: string;
  googleId?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
  lastLoginAt?: unknown;
};

@Injectable()
export class UserService {
  private readonly collectionName = 'users';
  private readonly allowedEmailsCollectionName = 'allowedEmails';
  private readonly db = initDB();
  private readonly googleClient = new OAuth2Client();

  constructor(private readonly databaseService: DatabaseService) {}

  async checkUserExists(userId: string): Promise<any> {
    try {
      return await this.databaseService.getDoc('users', userId);
    } catch {
      throw new NotFoundException(`Usuário com ID '${userId}' não encontrado`);
    }
  }

  async create(createUserDto: CreateUserDto) {
    try {
      const timestamp = Date.now();
      const email = this.normalizeEmail(createUserDto.email);

      const userData: UserData = {
        name: createUserDto.name,
        email,
        role: createUserDto.role ?? 'user',
        createdAt: timestamp,
        updatedAt: timestamp,
      };

      const createdUser = await this.databaseService.setNewDoc(
        this.collectionName,
        userData,
      );

      return {
        message: 'Usuario criado com sucesso',
        user: createdUser,
      };
    } catch (e: any) {
      console.error('Falha ao criar o usuário', e);
      return {
        success: false,
        message: e?.message,
      };
    }
  }

  async getUser(id: string) {
    try {
      if (!id || !id.length)
        throw new HttpException('id é obrigatório', HttpStatus.BAD_REQUEST);
      const userSnapshot = await this.databaseService.getDoc(
        this.collectionName,
        id,
      );

      return userSnapshot;
    } catch (e: any) {
      console.error('falha ao buscar usuário', e);
      return {
        success: false,
        message: e.message,
      };
    }
  }

  async getAllUser() {
    try {
      const foundUserList = await this.databaseService.getCollection(
        String(this.collectionName),
      );

      return {
        user_qtd: foundUserList.length,
        userList: foundUserList,
      };
    } catch (e: any) {
      console.error('Falha ao buscar lista de usuários', e);
      return {
        success: false,
        message: e.message,
      };
    }
  }

  async updateUser(id: string, updateUserDto: UpdateUserDto) {
    try {
      await this.checkUserExists(id);

      const timestamp = Date.now();
      const email = updateUserDto.email
        ? this.normalizeEmail(updateUserDto.email)
        : undefined;

      const updateData = this.removeEmptyValues({
        ...updateUserDto,
        email,
        updatedAt: timestamp,
      });

      await this.databaseService.updateDoc(
        this.collectionName,
        id,
        updateData,
      );

      return {
        message: 'Usuario atualizado com sucesso',
        user: await this.getUser(id),
      };
    } catch (e: any) {
      if (e instanceof NotFoundException) {
        throw e;
      }
      console.error('Falha ao atualizar o usuário', e);
      return {
        success: false,
        message: e.message,
      };
    }
  }

  async deleteUser(id: string) {
    try {
      const deleted: boolean = await this.databaseService.delDoc(
        this.collectionName,
        id,
      );

      return deleted
        ? {
            message: 'Usuário apagado com sucesso.',
            deletedUserId: id,
          }
        : {
            success: false,
            message: `Usuário '${id} não deletado'`,
          };
    } catch (e: any) {
      console.error('falha ao apagar usuário', e);
      return {
        success: false,
        message: e.message,
      };
    }
  }

  async register(createUserDto: CreateUserDto) {
    return this.create(createUserDto);
  }

  async loginWithGoogle(data: LoginGoogleDto) {
    try {
      const timestamp = Date.now();

      if (!data.idToken) {
        throw new BadRequestException('idToken e obrigatorio');
      }

      const ticket = await this.googleClient.verifyIdToken({
        idToken: data.idToken,
        audience:
          process.env.GOOGLE_CLIENT_ID || process.env.FIREBASE_AUTH_CLIENT_ID,
      });

      const payload = ticket.getPayload();

      if (!payload?.email) {
        throw new UnauthorizedException('Token do Google invalido');
      }

      if (!payload.email_verified) {
        throw new UnauthorizedException(
          'E-mail do Google ainda nao foi verificado',
        );
      }

      const email = this.normalizeEmail(payload.email);

      const userRef = doc(this.db, this.collectionName, payload.sub);
      const user = await getDoc(userRef);

      const userRole = user.data()?.role ?? 'user';

      const userData = {
        name: payload.name ?? email,
        email,
        role: userRole,
        provider: 'google',
        googleId: payload.sub,
        updatedAt: timestamp,
        lastLoginAt: timestamp,
      };

      const dataToSet = user.exists()
        ? userData
        : { ...userData, createdAt: timestamp };

      await setDoc(userRef, dataToSet, { merge: true });

      return {
        message: 'Login realizado com sucesso',
        user: {
          id: userRef.id,
          ...userData,
        },
      };
    } catch (e: any) {
      console.error('Falha ao fazer login com com o google');
      return {
        success: false,
        message: e.message,
      };
    }
  }

  private normalizeEmail(email: string) {
    if (!email) {
      throw new BadRequestException('E-mail e obrigatorio');
    }

    return email.trim().toLowerCase();
  }

  private removeEmptyValues<T extends Record<string, any>>(data: T) {
    return Object.fromEntries(
      Object.entries(data).filter(
        ([, value]) => value !== undefined && value !== null && value !== '',
      ),
    );
  }
}
