import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { NotFoundInterceptor } from 'src/common/interceptors';
import { Reflector } from '@nestjs/core';
import { AtGuard } from '../src/common/guards';
import { getAccessToken } from './test-helper';
import { PrismaService } from '../src/prisma/prisma.service';
import * as argon from 'argon2';
import { response } from 'express';

describe('Auth', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let accessToken: string;
  let email: string;
  let password: string;
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
    password = 'password';
    accessToken = await getAccessToken(app, email, password);
  });
  afterAll(async () => await app.close());

  describe('POST /login', () => {
    it('Should return tokens', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'mail2@host.com',
          password: 'password',
        });
      const { refreshToken } = await prisma.users.findUnique({
        where: { email: 'mail2@host.com' },
      });
      const hash = await argon.verify(
        refreshToken,
        response.body.refresh_token,
      );
      expect(response.status).toEqual(200);
      expect(response.body).toBeDefined();
      expect(hash).toBeTruthy();
    });

    it('Should return 403 status code for wrong email or password', async () => {
      const email: string = 'mail2@host.com';
      const password: string = 'wrongPassword';
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email, password });
      expect(response.statusCode).toEqual(403);
    });
  });

  describe('POST /register', () => {
    it('Should create new user in DB and return new token', async () => {
      const email = 'e2e7@host.com';
      const password = 'password';
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send({ email, password });
      const user = await prisma.users.findUnique({ where: { email } });
      expect(response.status).toEqual(201);
      expect(response.body.access_token).toBeDefined();
      expect(response.body.refresh_token).toBeDefined();
      expect(email).toEqual(user.email);
    });

    it('Should return 403 status code if passed email is already in usage', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send({ email, password });
      expect(response.status).toEqual(403);
    });
  });

  describe('POST /logout', () => {
    it('Should logout user and remove refresh token from database', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/logout')
        .send({ email, password })
        .set('Authorization', accessToken);
      const { refreshToken } = await prisma.users.findUnique({
        where: { email },
      });
      expect(response.status).toEqual(200);
      expect(refreshToken).toBeNull();
    });
  });
});
