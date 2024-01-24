import {
  Injectable,
  ConflictException,
  BadRequestException,
  Inject,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MysqlErrorCode } from '../common/enums/error-codes.enum';
import { SignUpDto } from './dto/sign-up.dto';
import { SignInDto } from './dto/sign-in.dto';
import { User } from '../user/entities/user.entity';
import { BcryptService } from './bcrypt.service';
import { randomUUID } from 'crypto';
import { IActiveUserData } from 'src/common/interfaces/active-user-data.interface';
import jwtConfig from '../common/config/jwt.config';
import { JwtService } from '@nestjs/jwt';
import { ConfigType } from '@nestjs/config';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    @Inject(jwtConfig.KEY)
    private readonly jwtConfiguration: ConfigType<typeof jwtConfig>,
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
      if (error.code === MysqlErrorCode.UniqueViolation) {
        throw new ConflictException([
          { email: `Email ${email} already exist` },
        ]);
      }
      throw error;
    }
  }

  async signIn(signInDto: SignInDto): Promise<{ accessToken: string }> {
    const { email, password } = signInDto;
    const user = await this.userRepository.findOne({
      where: {
        email,
      },
    });
    if (!user) {
      throw new BadRequestException('User not found with this email!');
    }

    const isPasswordMatch = await this.bcryptService.compare(
      password,
      user.passwordHash,
    );

    if (!isPasswordMatch) {
      throw new BadRequestException('The password is incorrect!');
    }

    return await this.generateAccessToken(user);
  }

  async generateAccessToken(
    user: Partial<User>,
  ): Promise<{ accessToken: string }> {
    const tokenId = randomUUID();

    const accessToken = await this.jwtService.signAsync(
      {
        id: user.id,
        email: user.email,
        tokenId,
      } as IActiveUserData,
      {
        secret: this.jwtConfiguration.secret,
        expiresIn: this.jwtConfiguration.accessTokenTtl,
      },
    );

    return { accessToken };
  }
}
