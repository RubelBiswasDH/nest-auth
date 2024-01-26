import {
  Injectable,
  ConflictException,
  BadRequestException,
  NotFoundException,
  Inject,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Equal } from 'typeorm';
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
import { RefreshToken } from 'src/token/entities/refresh-token.entity';
import * as dayjs from 'dayjs';
import { JwtPayload } from 'src/common/interfaces/jwt.payload.interface';
import { INVALID_TOKEN_MESSAGE } from 'src/common/constants';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    @Inject(jwtConfig.KEY)
    private readonly jwtConfiguration: ConfigType<typeof jwtConfig>,
    private readonly bcryptService: BcryptService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepository: Repository<RefreshToken>,
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

  async signIn(
    signInDto: SignInDto,
  ): Promise<{ accessToken: string; refreshToken: string }> {
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

    const { refreshToken } = await this.generateRefreshToken(user);
    const { accessToken } = await this.generateAccessToken(user);

    return { refreshToken, accessToken };
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

  async generateRefreshToken(
    user: Partial<User>,
  ): Promise<{ refreshToken: string }> {
    const tokenId = randomUUID();

    const refreshToken = await this.jwtService.signAsync(
      {
        id: user.id,
        email: user.email,
        tokenId,
      } as IActiveUserData,
      {
        secret: this.jwtConfiguration.secret,
        expiresIn: this.jwtConfiguration.refreshTokenTtl,
      },
    );

    const token = new RefreshToken();
    token.refreshToken = refreshToken;
    token.expiresAt = dayjs().add(7, 'd').toDate();
    token.userId = user.id!;
    this.refreshTokenRepository.save(token);

    return { refreshToken };
  }

  async getAccessTokenFromRefreshToken({
    refreshToken,
  }: {
    refreshToken: string;
  }): Promise<{ accessToken: string; refreshToken?: string }> {
    const token = await this.refreshTokenRepository.findOne({
      where: { refreshToken: refreshToken },
    });

    if (!token) {
      throw new NotFoundException(INVALID_TOKEN_MESSAGE);
    }

    const currentDate = new Date();

    if (token.expiresAt < currentDate) {
      throw new Error('Refresh token expired');
    }

    const oldPaload = this.jwtService.verify(refreshToken);
    const { accessToken } = await this.generateAccessToken(oldPaload);
    return { accessToken };
  }

  async validatePayload(payload: JwtPayload): Promise<any> {
    const user = await this.userRepository.findOne({
      where: { email: Equal(payload?.email ?? '') },
    });
    if (!user) {
      throw new UnauthorizedException({
        message: INVALID_TOKEN_MESSAGE,
      });
    }
    return { id: payload.id, email: payload.email, tokenId: payload.tokenId };
  }
}
