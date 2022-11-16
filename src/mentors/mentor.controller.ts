import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
} from '@nestjs/common';
import { GetCurrentUserId, Public } from '../common/decorators';
import { StatusType } from '../common/types';
import { MentorDto } from './dto';
import { MentorService } from './mentor.service';

@Controller('mentor')
export class MentorController {
  constructor(private mentorService: MentorService) {}

  @Public()
  @Get('mentors')
  getAllMentors(@Query('page', ParseIntPipe) page?: number) {
    return this.mentorService.getAllMentors(page);
  }

  @Public()
  @Get(':id')
  getMentor(@Param('id', ParseIntPipe) id: number) {
    return this.mentorService.getMentor(id);
  }

  @Post('')
  becomeMentor(@GetCurrentUserId() userId: number, @Body() dto: MentorDto) {
    return this.mentorService.becomeMentor(userId, dto);
  }

  @Post(':id')
  verifyPendingMentor(
    @GetCurrentUserId() userId: number,
    @Param('id', ParseIntPipe) mentorId: number,
    @Query('status') status: StatusType,
  ) {
    return this.mentorService.verifyPendingMentor(userId, mentorId, status);
  }
}
