import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { DataSource } from 'typeorm';
import { CoreConfig } from './../src/core/core.config';

describe('Quiz Game HW2 (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;

  beforeAll(async () => {
    // We need to make sure TestingModule is included
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
    .overrideProvider(CoreConfig)
    .useValue({
        includeTestingModule: true,
        databaseUrl: process.env.DATABASE_URL,
        env: 'testing',
        port: 5005,
    })
    .compile();

    app = moduleFixture.createNestApplication();
    const { appSetup } = require('../src/setup/app.setup');
    appSetup(app);

    await app.init();
    dataSource = app.get(DataSource);
  }, 60000);

  afterAll(async () => {
    if (app) {
        await app.close();
    }
  });

  beforeEach(async () => {
    await request(app.getHttpServer()).delete('/testing/all-data');
  });

  const adminAuth = 'Basic ' + Buffer.from('admin:qwerty').toString('base64');

  async function createUser(login: string, email: string) {
    const resp = await request(app.getHttpServer())
      .post('/sa/users')
      .set('Authorization', adminAuth)
      .send({ login, password: 'password123', email })
      .expect(201);
    return resp.body;
  }

  async function login(loginOrEmail: string) {
    const resp = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ loginOrEmail, password: 'password123' })
      .expect(200);
    return resp.body.accessToken;
  }

  it('GET /pair-game-quiz/users/my-statistic - should return statistics', async () => {
    const user1 = await createUser('user1', 'user1@test.com');
    const user2 = await createUser('user2', 'user2@test.com');
    const token1 = await login('user1');
    const token2 = await login('user2');

    // Create questions
    for (let i = 1; i <= 5; i++) {
        const q = await request(app.getHttpServer())
            .post('/sa/quiz/questions')
            .set('Authorization', adminAuth)
            .send({ body: `Question ${i} ??????????`, correctAnswers: ['yes'] })
            .expect(201);
        await request(app.getHttpServer())
            .put(`/sa/quiz/questions/${q.body.id}/publish`)
            .set('Authorization', adminAuth)
            .send({ published: true })
            .expect(204);
    }

    // Play a game
    await request(app.getHttpServer()).post('/pair-game-quiz/pairs/connection').set('Authorization', `Bearer ${token1}`).expect(200);
    await request(app.getHttpServer()).post('/pair-game-quiz/pairs/connection').set('Authorization', `Bearer ${token2}`).expect(200);

    for (let i = 0; i < 5; i++) {
        await request(app.getHttpServer()).post('/pair-game-quiz/pairs/my-current/answers').set('Authorization', `Bearer ${token1}`).send({ answer: 'yes' }).expect(200);
        await request(app.getHttpServer()).post('/pair-game-quiz/pairs/my-current/answers').set('Authorization', `Bearer ${token2}`).send({ answer: 'no' }).expect(200);
    }

    // Check stats for user1
    const stats1 = await request(app.getHttpServer())
        .get('/pair-game-quiz/users/my-statistic')
        .set('Authorization', `Bearer ${token1}`)
        .expect(200);

    expect(stats1.body).toEqual({
        sumScore: 6, // 5 correct + 1 bonus
        avgScores: 6,
        gamesCount: 1,
        winsCount: 1,
        lossesCount: 0,
        drawsCount: 0
    });

    // Check stats for user2
    const stats2 = await request(app.getHttpServer())
        .get('/pair-game-quiz/users/my-statistic')
        .set('Authorization', `Bearer ${token2}`)
        .expect(200);

    expect(stats2.body).toEqual({
        sumScore: 0,
        avgScores: 0,
        gamesCount: 1,
        winsCount: 0,
        lossesCount: 1,
        drawsCount: 0
    });
  }, 60000);

  it('GET /pair-game-quiz/pairs/my - should return history', async () => {
      const user1 = await createUser('user1', 'user1@test.com');
      const token1 = await login('user1');

      const gamesResp = await request(app.getHttpServer())
          .get('/pair-game-quiz/pairs/my')
          .set('Authorization', `Bearer ${token1}`)
          .expect(200);
      
      expect(gamesResp.body.items).toHaveLength(0);
      expect(gamesResp.body.totalCount).toBe(0);
  }, 60000);
});
