import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginGoogleDto } from './dto/login-google.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserService } from './user.service';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('create')
  createUser(@Body() createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto);
  }

  @Get('getUser/:id')
  getUserById(@Param('id') id: string) {
    return this.userService.getUser(id);
  }

  @Get('getAllUser')
  getAllUser() {
    return this.userService.getAllUser();
  }

  @Put('updateUser/:id')
  updateUser(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.userService.updateUser(id, updateUserDto);
  }

  @Delete('deleteUser/:id')
  deleteUser(@Param('id') id: string) {
    return this.userService.deleteUser(id);
  }

  @Post('login')
  login(@Body() loginGoogleDto: LoginGoogleDto) {
    return this.userService.loginWithGoogle(loginGoogleDto);
  }

  @Post('register')
  register(@Body() createUserDto: CreateUserDto) {
    return this.userService.register(createUserDto);
  }
}
