import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { GetCurrentUserId } from '../common/decorators';
import { StatusType } from '../common/types';
import { MentorshipDto } from './dto';
import { MentorshipService } from './mentorship.service';

@Controller('mentorship')
export class MentorshipController {
  constructor(private mentorshipService: MentorshipService) {}

  @Post('/:mentorId')
  sendMentorshipRequest(
    @GetCurrentUserId() userId: number,
    @Param('mentorId', ParseIntPipe) mentorId: number,
    @Body() dto: MentorshipDto,
  ) {
    return this.mentorshipService.sendMentorshipRequest(userId, mentorId, dto);
  }

  @Get('/myrequests')
  getMyMentorshipsRequests(@GetCurrentUserId() userId: number) {
    return this.mentorshipService.getMyMentorshipsRequests(userId);
  }

  @Get('/receivedRequests')
  getReceivedMentorshipsRequests(@GetCurrentUserId() userId: number) {
    return this.mentorshipService.getReceivedMentorshipsRequests(userId);
  }
  @Patch(':id')
  verifyPendingMentorships(
    @GetCurrentUserId() userId: number,
    @Param('id', ParseIntPipe) requestId: number,
    @Query('status') status: StatusType,
  ) {
    return this.mentorshipService.verifyPendingMentorships(
      userId,
      requestId,
      status,
    );
  }
}
