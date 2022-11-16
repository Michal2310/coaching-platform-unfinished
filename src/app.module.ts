import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';
import { MentorModule } from './mentors/mentor.module';
import { AbilityModule } from './ability/ability.module';
import { MentorshipModule } from './mentorship/mentorship.module';
import { UploadModule } from './upload/upload.module';
import { MulterModule } from '@nestjs/platform-express';
import { AccountModule } from './account/account.module';
import { MailModule } from './mail/mail.module';
import { ChatModule } from './gateway/gateway.module';

@Module({
  imports: [
    PrismaModule,
    ConfigModule.forRoot({ isGlobal: true }),
    MailModule,
    MentorModule,
    AbilityModule,
    MentorshipModule,
    MulterModule.register({
      dest: './files',
    }),
    UploadModule,
    AccountModule,
    ChatModule,
  ],
})
export class AppModule {}
