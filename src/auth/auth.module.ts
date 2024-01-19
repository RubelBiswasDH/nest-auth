import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthService } from './auth.service';
import { BcryptService } from './bcrypt.service';
import { AuthController } from './auth.controller';
import { UserService } from 'src/user/user.service';
import { User } from '../user/entities/user.entity';
import { IsEmailAlreadyExistConstraint } from '../common/decorators/isEmailAlreadyExist.decorator';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  controllers: [AuthController],
  providers: [
    AuthService,
    BcryptService,
    IsEmailAlreadyExistConstraint,
    UserService,
  ],
})
export class AuthModule {}
