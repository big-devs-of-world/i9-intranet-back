import { Injectable, InternalServerErrorException, NotFoundException } from "@nestjs/common";
import { DatabaseService } from "../database/database.service";
import { CreateUserDto } from "./dto/create-user.dto";

@Injectable()
export class UserService {
  private readonly collectionName = 'users';

  constructor(private readonly databaseService: DatabaseService) {}

  async createUser(createUserDto: CreateUserDto) {
    try {
      const data = {
        ...createUserDto,
        createdAt: new Date().toISOString()
      };
      const userId = await this.databaseService.createDoc(this.collectionName, data);
      return { id: userId, ...data };
    } catch (error) {
      throw new InternalServerErrorException('Failed to create user');
    }
  }

  async getUserById(id: string) {
    try {
      const user = await this.databaseService.getDoc(this.collectionName, id);
      return user;
    } catch (error) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
  }
}