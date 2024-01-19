import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { SignUpDto } from './dto/sign-up.dto';
import { User } from '../user/entities/user.entity';
import { BcryptService } from './bcrypt.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly bcryptService: BcryptService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async signUp(signUpDto: SignUpDto): Promise<void> {
    const { email, password } = signUpDto;
    try {
      const user = new User();
      user.email = email;
      user.passwordHash = await this.bcryptService.hash(password);
      await this.userRepository.save(user);
    } catch (error) {
      throw error;
    }
  }
}
