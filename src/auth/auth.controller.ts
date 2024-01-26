import {
  Controller,
  Post,
  Body,
  Query,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignUpDto } from './dto/sign-up.dto';
import { SignInDto } from './dto/sign-in.dto';
import { Public } from '../common/decorators/public.decorator';
import { JwtRTGuard } from './guards/jwt-rt-guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { UseGuards } from '@nestjs/common';
import { RefreshTokenDTO } from 'src/token/dtos/refresh-token.dto';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';

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
}
