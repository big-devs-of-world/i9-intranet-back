import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
} from '@nestjs/common';

import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';

import { CreateUserDto } from './dto/create-user.dto';
import { LoginGoogleDto } from './dto/login-google.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserService } from './user.service';

@ApiTags('User')
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) { }

  @Post('create')
  @ApiOperation({ summary: 'Criar usuário' })
  @ApiBody({ type: CreateUserDto })
  @ApiResponse({ status: 201, description: 'Usuário criado com sucesso' })
  createUser(@Body() createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto);
  }

  @Get('getUser/:id')
  @ApiOperation({ summary: 'Buscar usuário por ID' })
  @ApiParam({ name: 'id', type: String })
  getUserById(@Param('id') id: string) {
    return this.userService.getUser(id);
  }

  @Get('getAllUser')
  @ApiOperation({ summary: 'Listar todos usuários' })
  getAllUser() {
    return this.userService.getAllUser();
  }

  @Put('updateUser/:id')
  @ApiOperation({ summary: 'Atualizar usuário' })
  @ApiParam({ name: 'id', type: String })
  @ApiBody({ type: UpdateUserDto })
  updateUser(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.userService.updateUser(id, updateUserDto);
  }

  @Delete('deleteUser/:id')
  @ApiOperation({ summary: 'Deletar usuário' })
  @ApiParam({ name: 'id', type: String })
  deleteUser(@Param('id') id: string) {
    return this.userService.deleteUser(id);
  }

  @Post('login')
  @ApiOperation({ summary: 'Login com Google' })
  @ApiBody({ type: LoginGoogleDto })
  login(@Body() body: LoginGoogleDto) {
    return this.userService.loginWithGoogle(body);
  }

  @Post('register')
  @ApiOperation({ summary: 'Registrar usuário' })
  @ApiBody({ type: CreateUserDto })
  register(@Body() createUserDto: CreateUserDto) {
    return this.userService.register(createUserDto);
  }
}