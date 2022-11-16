import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { NotFoundInterceptor } from 'src/common/interceptors';
import { Reflector } from '@nestjs/core';
import { AtGuard } from '../src/common/guards';
import { getAccessToken } from './test-helper';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Account', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let email: string;
  let accessToken: string;
  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    prisma = moduleFixture.get<PrismaService>(PrismaService);
    app = moduleFixture.createNestApplication();
    app.useGlobalInterceptors(new NotFoundInterceptor());
    const reflector = new Reflector();
    app.useGlobalGuards(new AtGuard(reflector));
    await app.init();
    email = 'mail2@host.com';
    accessToken = await getAccessToken(app, email, 'password');
  });
  afterAll(async () => await app.close());

  describe('GET /', () => {
    it('Should return user object', async () => {
      const response = await request(app.getHttpServer())
        .get('/account')
        .set('Authorization', accessToken);
      expect(response.status).toEqual(200);
      expect(response.body).toBeDefined();
      expect(response.body.email).toEqual(email);
    });
  });

  describe('PATCH /', () => {
    it('Should return user object with updated password', async () => {
      const newPassword = 'password';
      const response = await request(app.getHttpServer())
        .patch('/account')
        .send({
          password: newPassword,
        })
        .set('Authorization', accessToken);
      const { password } = await prisma.users.findUnique({ where: { email } });
      expect(response.status).toEqual(200);
      expect(response.body).toBeDefined();
      expect(response.body.password).toEqual(password);
    });
  });
});
