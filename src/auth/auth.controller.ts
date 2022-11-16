import {
  Body,
  Controller,
  Post,
  Get,
  HttpCode,
  HttpStatus,
  UseGuards,
  Query,
  HttpException,
} from '@nestjs/common';
import { LoginDto, RegisterDto } from './dto';
import { Tokens } from './types';
import { AuthService } from './auth.service';
import { RtGuard } from '../common/guards';
import {
  GetCurrentUser,
  GetCurrentUserId,
  Public,
} from 'src/common/decorators';

@Controller('auth')
export class AuthController {
  constructor(private userService: AuthService) {}

  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  register(@Body() dto: RegisterDto) {
    return this.userService.register(dto);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: LoginDto): Promise<Tokens> {
    return this.userService.login(dto);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  logout(@GetCurrentUserId() userId: number) {
    return this.userService.logout(userId);
  }

  @Public()
  @UseGuards(RtGuard)
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  refreshToken(
    @GetCurrentUserId() userId: number,
    @GetCurrentUser('refreshToken') refreshToken: string,
  ) {
    return this.userService.refresh(userId, refreshToken);
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Get('verificationToken')
  async verificationToken(
    @Query('verificationToken') verificationToken: string,
    @Query('email') email: string,
  ) {
    return this.userService.verificationToken(verificationToken, email);
  }
}
