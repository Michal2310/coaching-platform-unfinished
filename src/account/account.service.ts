import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as argon from 'argon2';

@Injectable()
export class AccountService {
  constructor(private prisma: PrismaService) {}

  async getUser(userId: number) {
    try {
      const user = await this.prisma.users.findUnique({
        where: { id: userId },
        include: {
          country: true,
          languages: {
            select: {
              language: true,
            },
          },
          skills: {
            select: {
              skill: true,
            },
          },
          image: {
            select: {
              fileUrl: true,
            },
          },
        },
      });
      delete user.password;
      if (!user) throw new NotFoundException();
      return user;
    } catch (error) {
      throw error;
    }
  }
  async changePassword(userId: number, password: string) {
    try {
      const user = await this.prisma.users.findUnique({
        where: { id: userId },
      });
      if (!user) throw new NotFoundException();
      const hashedPassword = await argon.hash(password);
      const updatedUser = await this.prisma.users.update({
        where: {
          id: userId,
        },
        data: {
          password: hashedPassword,
        },
      });
      return updatedUser;
    } catch (error) {
      throw error;
    }
  }
}
