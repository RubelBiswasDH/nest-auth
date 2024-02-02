import {
  BadRequestException,
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { RefreshTokenDTO } from 'src/token/dtos/refresh-token.dto';
import { Public } from '../common/decorators/public.decorator';
import { AuthService } from './auth.service';
import { ConfirmPasswordDto } from './dto/confirm-password.dto';
import { SignInDto } from './dto/sign-in.dto';
import { SignUpDto } from './dto/sign-up.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { JwtRTGuard } from './guards/jwt-rt-guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('sign-up')
  signUp(@Body() signUpDto: SignUpDto) {
    return this.authService.signUp(signUpDto);
  }

  @HttpCode(HttpStatus.OK)
  @Public()
  @Post('sign-in')
  signIn(@Body() signInDto: SignInDto): Promise<{ accessToken: string }> {
    return this.authService.signIn(signInDto);
  }

  @UseGuards(JwtRTGuard)
  @Public()
  @Post('refresh-token')
  refreshToken(
    @Body() refreshTokenDto: RefreshTokenDTO,
  ): Promise<{ accessToken: string; refreshToken?: string }> {
    return this.authService.getAccessTokenFromRefreshToken(refreshTokenDto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(
    @CurrentUser('id') userId: number,
    @Query('fromAll') fromAll: boolean = false,
    @Body('refreshToken') refreshToken: string,
  ): Promise<any> {
    if (fromAll) {
      return { message: 'Logout successfully from all devices!' };
      // await this.authService.logoutFromAll(userId);
    } else {
      if (!refreshToken) {
        throw new BadRequestException('No refresh token provided');
      }
      await this.authService.logout(refreshToken, userId);
      return { message: 'Logout successfully!' };
    }
  }

  @Public()
  @Post('request-reset-password')
  @HttpCode(HttpStatus.OK)
  async requestResetPassword(
    @Body() body: Partial<SignInDto>,
    @Req() req: Request,
  ): Promise<any> {
    return await this.authService.requestResetPassword(
      body.email!,
      `${req.protocol}://${req.get('Host')}`,
    );
  }

  @Public()
  @Post('confirm-reset-password')
  @HttpCode(HttpStatus.OK)
  async confirmResetPassword(
    @Query() query: { token: string; tokenId: number },
    @Body() data: ConfirmPasswordDto,
  ): Promise<any> {
    return await this.authService.confirmResetPassword(query, data.newPassword);
  }
}
