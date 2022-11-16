import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';
@Injectable()
export class MailService {
  constructor(
    private readonly mailerService: MailerService,
    private config: ConfigService,
  ) {}

  async sendMail(userEmail: string, verificationToken: string) {
    await this.mailerService.sendMail({
      to: userEmail,
      from: this.config.get('MAIL_FROM'),
      subject: 'Testing Nest MailerModule ✔',
      text: 'welcome',
      html: `verify your email: http://localhost:${this.config.get(
        'PORT',
      )}/auth/verificationToken?verificationToken=${verificationToken}&email=${userEmail}`,
    });
  }
}
