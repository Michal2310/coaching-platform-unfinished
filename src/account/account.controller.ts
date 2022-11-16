import { Body, Controller, Get, Patch } from '@nestjs/common';
import { GetCurrentUserId } from '../common/decorators';
import { AccountService } from './account.service';

@Controller('account')
export class AccountController {
  constructor(private accountSerive: AccountService) {}

  @Get('')
  getUser(@GetCurrentUserId() userId: number) {
    return this.accountSerive.getUser(userId);
  }

  @Patch('')
  changePassword(
    @GetCurrentUserId() userId: number,
    @Body() body: { password: string },
  ) {
    return this.accountSerive.changePassword(userId, body.password);
  }
}
