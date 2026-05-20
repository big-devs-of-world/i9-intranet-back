import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { OAuth2Client } from 'google-auth-library';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { initDB } from '../database/connection.database';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginGoogleDto } from './dto/login-google.dto';
import { UpdateUserDto } from './dto/update-user.dto';

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

  async create(createUserDto: CreateUserDto) {
    const email = this.normalizeEmail(createUserDto.email);
    await this.ensureEmailIsAllowed(email);

    const userRef = doc(collection(this.db, this.collectionName));
    const userData: UserData = {
      name: createUserDto.name,
      email,
      role: createUserDto.role ?? 'user',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    await setDoc(userRef, userData);

    return {
      message: 'Usuario criado com sucesso',
      user: {
        id: userRef.id,
        ...userData,
      },
    };
  }

  async getUser(id: string) {
    const userRef = doc(this.db, this.collectionName, id);
    const userSnapshot = await getDoc(userRef);

    if (!userSnapshot.exists()) {
      throw new NotFoundException('Usuario nao encontrado');
    }

    return {
      id: userSnapshot.id,
      ...userSnapshot.data(),
    };
  }

  async getAllUser() {
    const usersSnapshot = await getDocs(
      collection(this.db, this.collectionName),
    );

    return usersSnapshot.docs.map((user) => ({
      id: user.id,
      ...user.data(),
    }));
  }

  async updateUser(id: string, updateUserDto: UpdateUserDto) {
    const userRef = doc(this.db, this.collectionName, id);
    const userSnapshot = await getDoc(userRef);

    if (!userSnapshot.exists()) {
      throw new NotFoundException('Usuario nao encontrado');
    }

    const email = updateUserDto.email
      ? this.normalizeEmail(updateUserDto.email)
      : undefined;
    const updateData = this.removeEmptyValues({
      ...updateUserDto,
      email,
      updatedAt: serverTimestamp(),
    });

    if (email) {
      await this.ensureEmailIsAllowed(email);
    }

    await updateDoc(userRef, updateData);

    return {
      message: 'Usuario atualizado com sucesso',
      user: await this.getUser(id),
    };
  }

  async deleteUser(id: string) {
    const userRef = doc(this.db, this.collectionName, id);
    const userSnapshot = await getDoc(userRef);

    if (!userSnapshot.exists()) {
      throw new NotFoundException('Usuario nao encontrado');
    }

    await deleteDoc(userRef);

    return {
      message: 'Usuario removido com sucesso',
      id,
    };
  }

  async register(createUserDto: CreateUserDto) {
    return this.create(createUserDto);
  }

  async loginWithGoogle(loginGoogleDto: LoginGoogleDto) {
    if (!loginGoogleDto.idToken) {
      throw new BadRequestException('idToken e obrigatorio');
    }

    const ticket = await this.googleClient.verifyIdToken({
      idToken: loginGoogleDto.idToken,
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
    await this.ensureEmailIsAllowed(email);

    const userRef = doc(this.db, this.collectionName, payload.sub);
    const userSnapshot = await getDoc(userRef);
    const userData = {
      name: payload.name ?? email,
      email,
      role: userSnapshot.exists()
        ? (userSnapshot.data().role ?? 'user')
        : 'user',
      provider: 'google',
      googleId: payload.sub,
      updatedAt: serverTimestamp(),
      lastLoginAt: serverTimestamp(),
    };

    await setDoc(
      userRef,
      userSnapshot.exists()
        ? userData
        : {
            ...userData,
            createdAt: serverTimestamp(),
          },
      { merge: true },
    );

    return {
      message: 'Login realizado com sucesso',
      user: {
        id: userRef.id,
        ...userData,
      },
    };
  }

  private async ensureEmailIsAllowed(email: string) {
    const allowedByIdRef = doc(
      this.db,
      this.allowedEmailsCollectionName,
      email,
    );
    const allowedByIdSnapshot = await getDoc(allowedByIdRef);

    if (allowedByIdSnapshot.exists()) {
      return;
    }

    const allowedByEmailQuery = query(
      collection(this.db, this.allowedEmailsCollectionName),
      where('email', '==', email),
    );
    const allowedByEmailSnapshot = await getDocs(allowedByEmailQuery);

    if (allowedByEmailSnapshot.empty) {
      throw new ForbiddenException('E-mail nao esta na lista de permitidos');
    }
  }

  private normalizeEmail(email: string) {
    if (!email) {
      throw new BadRequestException('E-mail e obrigatorio');
    }

    return email.trim().toLowerCase();
  }

  private removeEmptyValues<T extends Record<string, unknown>>(data: T) {
    return Object.fromEntries(
      Object.entries(data).filter(
        ([, value]) => value !== undefined && value !== null && value !== '',
      ),
    );
  }
}
