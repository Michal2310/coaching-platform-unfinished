import { ForbiddenException, Injectable, Redirect } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { RegisterDto, LoginDto } from './dto';
import * as argon from 'argon2';
import { Tokens } from './types';
import { JwtService } from '@nestjs/jwt';
import { randomBytes } from 'crypto';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime';
import { ConfigService } from '@nestjs/config';
import { MailService } from '../mail/mail.service';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
    private mailer: MailService,
  ) {}

  async register(dto: RegisterDto) {
    try {
      const hashedPassword = await argon.hash(dto.password);
      const verificationToken = await this.generatateCode(5);
      const newUser = await this.prisma.users.create({
        data: {
          email: dto.email,
          password: hashedPassword,
          verifyToken: verificationToken,
        },
      });
      await this.mailer.sendMail(newUser.email, newUser.verifyToken);
      const tokens = await this.getTokens(newUser.id, newUser.email);
      await this.updateRefreshToken(newUser.id, tokens.refresh_token);
      return tokens;
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError)
        if (error.code === 'P2002')
          throw new ForbiddenException('Credentials taken');
      throw error;
    }
  }

  async login(dto: LoginDto): Promise<Tokens> {
    try {
      const user = await this.prisma.users.findUnique({
        where: {
          email: dto.email,
        },
      });
      if (!user) throw new ForbiddenException('Access denied');
      const passwordMatch = await argon.verify(user.password, dto.password);
      if (!passwordMatch) throw new ForbiddenException('Access denied');
      const tokens = await this.getTokens(user.id, user.email);
      await this.updateRefreshToken(user.id, tokens.refresh_token);
      return tokens;
    } catch (error) {
      if (error instanceof ForbiddenException)
        throw new ForbiddenException('Email or password is incorrect');
      throw error;
    }
  }

  async logout(userId: number) {
    try {
      return await this.prisma.users.updateMany({
        where: {
          id: userId,
          refreshToken: {
            not: null,
          },
        },
        data: {
          refreshToken: null,
        },
      });
    } catch (error) {
      throw error;
    }
  }

  async refresh(userId: number, rt: string) {
    try {
      const user = await this.prisma.users.findUnique({
        where: {
          id: userId,
        },
      });
      if (!user || user.refreshToken)
        throw new ForbiddenException('Acccess denied');
      const refreshTokenMatch = await argon.verify(user.refreshToken, rt);
      if (!refreshTokenMatch) throw new ForbiddenException('Acccess denied');
      const tokens = await this.getTokens(user.id, user.email);
      await this.updateRefreshToken(user.id, tokens.refresh_token);
      return tokens;
    } catch (error) {
      throw error;
    }
  }

  async verificationToken(verificationToken: string, email: string) {
    try {
      const user = await this.prisma.users.findUnique({
        where: {
          email,
        },
      });
      if (!user) return null;
      if (user.verifyToken == verificationToken) {
        Redirect(`http://localhost:${this.config.get('PORT')}/`, 200);
        return await this.prisma.users.update({
          where: {
            email,
          },
          data: {
            isVerified: true,
          },
        });
      }
      return null;
    } catch (error) {
      throw error;
    }
  }

  async getTokens(userId: number, email: string): Promise<Tokens> {
    const [accessToken, refreshToken] = await Promise.all([
      this.jwt.signAsync(
        { sub: userId, email },
        { secret: 'at-secret', expiresIn: 60 * 60 * 60 },
      ),
      this.jwt.signAsync(
        { sub: userId, email },
        { secret: 'rt-secret', expiresIn: 60 * 60 * 24 * 7 },
      ),
    ]);

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
    };
  }

  async updateRefreshToken(userId: number, rt: string) {
    const hashedRefreshToken = await argon.hash(rt);
    await this.prisma.users.update({
      where: {
        id: userId,
      },
      data: {
        refreshToken: hashedRefreshToken,
      },
    });
  }

  async generatateCode(bytes: number) {
    return randomBytes(bytes).toString('hex');
  }
}
