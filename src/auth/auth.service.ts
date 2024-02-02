import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { randomBytes, randomUUID } from 'crypto';
import * as dayjs from 'dayjs';
import {
  INVALID_TOKEN_MESSAGE,
  USER_DOES_NOT_EXIST,
} from 'src/common/constants';
import { IActiveUserData } from 'src/common/interfaces/active-user-data.interface';
import { JwtPayload } from 'src/common/interfaces/jwt.payload.interface';
import { EmailDataDto } from 'src/mail/dtos/email-data.dto';
import { MailService } from 'src/mail/mail.service';
import { RefreshToken } from 'src/token/entities/refresh-token.entity';
import { ResetPasswordToken } from 'src/token/entities/reset-password-token.entity';
import { TokenService } from 'src/token/token.service';
import { Equal, Repository } from 'typeorm';
import jwtConfig from '../common/config/jwt.config';
import { MysqlErrorCode } from '../common/enums/error-codes.enum';
import { User } from '../user/entities/user.entity';
import { BcryptService } from './bcrypt.service';
import { SignInDto } from './dto/sign-in.dto';
import { SignUpDto } from './dto/sign-up.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly mailService: MailService,
    private readonly tokenService: TokenService,
    private readonly jwtService: JwtService,
    @Inject(jwtConfig.KEY)
    private readonly jwtConfiguration: ConfigType<typeof jwtConfig>,
    private readonly bcryptService: BcryptService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepository: Repository<RefreshToken>,
    @InjectRepository(ResetPasswordToken)
    private readonly resetPasswordTokenRepository: Repository<ResetPasswordToken>,
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
    token.expiresAt = dayjs()
      .add(
        Number(this.jwtConfiguration.refreshTokenTtlValue),
        this.jwtConfiguration.refreshTokenTtlUnit as any,
      )
      .toDate();
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
      where: { refreshToken: Equal(refreshToken), isBlackListed: Equal(0) },
    });

    if (!token) {
      throw new UnauthorizedException(INVALID_TOKEN_MESSAGE);
    }

    const currentDate = new Date();

    if (token.expiresAt < currentDate) {
      throw new BadRequestException('Refresh token expired');
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

  async logout(refreshToken: string, userId: number): Promise<any> {
    await this.tokenService.blacklistToken(refreshToken, userId);
  }

  async requestResetPassword(email: string, host: string = ''): Promise<any> {
    const user = await this.userRepository.findOne({
      where: { email: Equal(email) },
    });

    if (!user) {
      throw new BadRequestException(USER_DOES_NOT_EXIST);
    }

    // Black List Previous Tokens
    await this.resetPasswordTokenRepository.update(
      { userId: user.id, isBlackListed: 0 },
      { isBlackListed: 1 },
    );

    const resetPasswordToken = randomBytes(32).toString('hex');

    const resetPasswordTokenHash =
      await this.bcryptService.hash(resetPasswordToken);

    const token = new ResetPasswordToken();
    token.resetPasswordToken = resetPasswordTokenHash;
    token.expiresAt = dayjs().add(120, 's').toDate();
    token.userId = user.id!;
    const tokenRes = await this.resetPasswordTokenRepository.save(token);
    const resetPasswordLink = `${host}/auth/reset-password?token=${resetPasswordToken}&tokenId=${tokenRes.id}`;

    await this.mailService.sendEmail({
      to: email,
      subject: 'Reset Your Password',
      html: `<div>
    Reset Password by clicking this link <a href="${resetPasswordLink}" target="_blank">Reset Password</a></div>`,
    } as EmailDataDto);
    return { message: 'Password reset email sent' };
  }

  async confirmResetPassword(query: any, newPassword: string): Promise<any> {
    const resetPasswordToken = await this.resetPasswordTokenRepository.findOne({
      where: {
        id: Equal(query?.tokenId ?? ''),
        isBlackListed: Equal(0),
      },
    });

    const currentDate = new Date();

    if (!resetPasswordToken) {
      throw new BadRequestException(INVALID_TOKEN_MESSAGE);
    }

    if (resetPasswordToken.expiresAt < currentDate) {
      await this.resetPasswordTokenRepository.save(
        Object.assign(resetPasswordToken, {
          isBlackListed: 1,
        }),
      );
      throw new BadRequestException('Password reset token expired');
    }

    const isTokenMatched = await this.bcryptService.compare(
      query.token,
      resetPasswordToken.resetPasswordToken,
    );

    if (!isTokenMatched) {
      throw new BadRequestException(INVALID_TOKEN_MESSAGE);
    }

    const passwordHash = await this.bcryptService.hash(newPassword);
    const user = await this.userRepository.findOne({
      where: { id: resetPasswordToken.userId },
    });

    if (!user) throw new BadRequestException(INVALID_TOKEN_MESSAGE);

    await this.userRepository.update(
      { id: resetPasswordToken.userId },
      { passwordHash: passwordHash },
    );

    await this.resetPasswordTokenRepository.save(
      Object.assign(resetPasswordToken, {
        isBlackListed: 1,
        isPasswordResetConfirmed: 1,
      }),
    );

    await this.mailService.sendEmail({
      to: user.email,
      subject: 'Password has been reset!',
      html: `<div>Your password has been reset successfully. Please sign in with your new password.</div>`,
    } as EmailDataDto);

    return { message: 'Password Updated Successfully' };
  }
}
