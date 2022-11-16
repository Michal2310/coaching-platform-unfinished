import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { NotFoundInterceptor } from 'src/common/interceptors';
import { Reflector } from '@nestjs/core';
import { AtGuard } from '../src/common/guards';
import { getAccessToken } from './test-helper';
import { PrismaService } from '../src/prisma/prisma.service';
import { MentorDto } from '../src/mentors/dto';
import { StatusType } from '../src/common/types';

describe('Mentor', () => {
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

  describe('GET /', () => {
    it('Should return all mentors', async () => {
      const response = await request(app.getHttpServer())
        .get('/mentor/mentors')
        .query({ page: 1 });
      expect(response.status).toEqual(200);
    });
  });

  describe('GET /:id', () => {
    it('Should return mentor with passed id', async () => {
      const id: number = 2;
      const response = await request(app.getHttpServer()).get(`/mentor/${id}`);
      const user = await prisma.users.findUnique({ where: { id } });
      expect(response.status).toEqual(200);
      expect(response.body).toBeDefined();
      expect(response.body.email).toEqual(user.email);
    });

    it('Should return 404 status code for not existing id', async () => {
      const id: number = 999;
      const response = await request(app.getHttpServer()).get(`/mentor/${id}`);
      expect(response.statusCode).toEqual(404);
    });
  });

  describe('POST /', () => {
    it('Should create request for become a mentor in DB', async () => {
      const body: MentorDto = {
        firstname: 'myFirstName',
        lastname: 'myLastName',
        about: 'aboutMe',
        title: 'Developer',
        country: 'poland',
        skills: ['nodejs'],
        languages: ['polish'],
      };
      const response = await request(app.getHttpServer())
        .post('/mentor')
        .send(body)
        .set('Authorization', accessToken);
      expect(response.status).toEqual(201);
      expect(response.body.message).toBeDefined();
    });
  });

  describe('POST /:id', () => {
    it('Should update become mentor request with Accepted or Rejected status', async () => {
      const id: number = 2;
      const status: StatusType = StatusType.Accepted;
      const response = await request(app.getHttpServer())
        .post(`/mentor/${id}`)
        .query({ status })
        .set('Authorization', accessToken);
      expect(response.status).toEqual(201);
    });
  });
});
