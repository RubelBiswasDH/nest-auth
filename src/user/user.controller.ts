import { Controller, Get, Param } from '@nestjs/common';

import { UserService } from './user.service';

@Controller('users')
export class UserController {
  constructor(private readonly usersService: UserService) {}
  //   @Get('me')
  //   async getMe(@ActiveUser('id') userId: string): Promise<User> {
  //     return this.usersService.getMe(userId);
  //   }
  @Get('/:id')
  async findOne(@Param('id') id: any) {
    const todo = await this.usersService.getMe(id);
    return todo;
  }
}
