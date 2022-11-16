import { Injectable, NotFoundException } from '@nestjs/common';
import { StatusType } from '../common/types';
import { PrismaService } from '../prisma/prisma.service';
import { MentorshipDto } from './dto';

@Injectable()
export class MentorshipService {
  constructor(private prisma: PrismaService) {}
  async sendMentorshipRequest(
    userId: number,
    mentorId: number,
    dto: MentorshipDto,
  ) {
    try {
      const mentor = await this.prisma.mentors.findUnique({
        where: { id: mentorId },
      });
      if (!mentor) throw new NotFoundException();
      return await this.prisma.mentorships.create({
        data: {
          background: dto.background,
          expectations: dto.expectations,
          message: dto.message,
          senderId: userId,
          mentorId,
        },
      });
    } catch (error) {
      throw error;
    }
  }
  async getMyMentorshipsRequests(userId: number) {
    try {
      const mentorships = await this.prisma.mentorships.findMany({
        where: {
          senderId: userId,
        },
      });
      return mentorships;
    } catch (error) {
      throw error;
    }
  }
  async getReceivedMentorshipsRequests(userId: number) {
    try {
      return await this.prisma.mentorships.findMany({
        where: {
          AND: [{ mentorId: userId }, { status: 'Pending' }],
        },
      });
    } catch (error) {
      throw error;
    }
  }
  async verifyPendingMentorships(
    mentorId: number,
    requestId: number,
    status: StatusType,
  ) {
    try {
      const request = await this.prisma.mentorships.findUnique({
        where: {
          id: requestId,
        },
      });
      if (!request) throw new NotFoundException();
      const updatedRequest = await this.prisma.mentorships.update({
        where: { id: requestId },
        data: {
          status: status,
        },
      });
      if (updatedRequest.status === 'Accepted') {
        await this.prisma.rooms.create({
          data: {
            users: {
              connect: [
                {
                  id: mentorId,
                },
                {
                  id: request.senderId,
                },
              ],
            },
          },
        });

        return updatedRequest;
      }
    } catch (error) {
      throw error;
    }
  }
}
