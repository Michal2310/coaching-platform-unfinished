import { ForbiddenError } from '@casl/ability';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime';
import { AbilityFactory, Action } from '../ability/ability.factory';
import { StatusType } from '../common/types';
import { PrismaService } from '../prisma/prisma.service';
import { MentorDto } from './dto';

@Injectable()
export class MentorService {
  constructor(
    private prisma: PrismaService,
    private abilityFactory: AbilityFactory,
  ) {}
  async getAllMentors(page: number) {
    try {
      const mentors = await this.prisma.mentors.findMany({
        skip: 20 * (page - 1),
        take: 20,
        where: {
          status: 'Accepted',
        },
        include: {
          user: {
            select: {
              firstname: true,
              lastname: true,
              title: true,
              about: true,
              skills: true,
              languages: true,
              image: {
                select: {
                  fileUrl: true,
                },
              },
            },
          },
        },
      });
      if (mentors.length < 1) throw new NotFoundException('');
      return mentors;
    } catch (error) {
      throw error;
    }
  }
  async getMentor(mentorId: number) {
    try {
      const mentor = await this.prisma.users.findMany({
        where: {
          id: mentorId,
          isMentor: true,
        },
        select: {
          firstname: true,
          lastname: true,
          email: true,
          title: true,
          about: true,
          skills: true,
          languages: true,
          image: {
            select: {
              fileUrl: true,
            },
          },
        },
      });

      if (mentor.length < 1) throw new NotFoundException('Mentor not found!');

      await this.prisma.mentors.update({
        where: { id: mentorId },
        data: {
          views: {
            increment: 1,
          },
        },
      });

      return mentor[0];
    } catch (error) {
      throw error;
    }
  }
  async becomeMentor(userId: number, dto: MentorDto) {
    try {
      const user = this.prisma.users.update({
        where: {
          id: userId,
        },
        data: {
          firstname: dto.firstname,
          lastname: dto.lastname,
          title: dto.title,
          about: dto.about,
          country: {
            connect: {
              country: dto.country,
            },
          },
          languages: {
            connect: dto.languages.map((language) => {
              return {
                language,
              };
            }),
          },
          skills: {
            connect: dto.skills.map((skill) => {
              return {
                skill,
              };
            }),
          },
        },
        include: {
          country: true,
          languages: true,
          skills: true,
        },
      });

      const mentor = this.prisma.mentors.create({
        data: {
          userId,
        },
      });

      await this.prisma.$transaction([user, mentor]);
      return { message: 'Mentor request sent!' };
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError)
        if (error.code === 'P2025')
          throw new BadRequestException(
            'Something from req is not exists in db',
          );
      throw error;
    }
  }
  async verifyPendingMentor(
    userId: number,
    mentorId: number,
    status: StatusType,
  ) {
    try {
      const user = await this.prisma.users.findUnique({
        where: { id: userId },
      });
      const ability = this.abilityFactory.createForUser(user);
      ForbiddenError.from(ability).throwUnlessCan(Action.Update, user);
      const updatedUser = this.prisma.users.update({
        where: {
          id: mentorId,
        },
        data: {
          isMentor: status === StatusType.Accepted ? true : false,
        },
      });
      const mentor = this.prisma.mentors.update({
        where: {
          id: mentorId,
        },
        data: {
          status: {
            set: status,
          },
        },
      });
      await this.prisma.$transaction([updatedUser, mentor]);
      return { message: 'User and mentor updated' };
    } catch (error) {
      if (error instanceof ForbiddenError) throw new UnauthorizedException();
      throw error;
    }
  }
}
