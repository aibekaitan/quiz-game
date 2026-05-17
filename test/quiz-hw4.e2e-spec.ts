import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { DataSource } from 'typeorm';
import { CoreConfig } from './../src/core/core.config';

describe('Quiz Game HW4 (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;

  beforeAll(async () => {
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

  it('10-second rule: game should finish automatically', async () => {
    const user1 = await createUser('user1', 'u1@test.com');
    const user2 = await createUser('user2', 'u2@test.com');
    const token1 = await login('user1');
    const token2 = await login('user2');

    // Create questions
    for (let i = 1; i <= 5; i++) {
        const q = await request(app.getHttpServer())
            .post('/sa/quiz/questions')
            .set('Authorization', adminAuth)
            .send({ body: `Q${i} ??????????`, correctAnswers: ['yes'] })
            .expect(201);
        await request(app.getHttpServer())
            .put(`/sa/quiz/questions/${q.body.id}/publish`)
            .set('Authorization', adminAuth)
            .send({ published: true })
            .expect(204);
    }

    // Start game
    const join1 = await request(app.getHttpServer()).post('/pair-game-quiz/pairs/connection').set('Authorization', `Bearer ${token1}`).expect(200);
    await request(app.getHttpServer()).post('/pair-game-quiz/pairs/connection').set('Authorization', `Bearer ${token2}`).expect(200);

    // User 1 finishes all 5 questions
    for (let i = 0; i < 5; i++) {
        await request(app.getHttpServer()).post('/pair-game-quiz/pairs/my-current/answers').set('Authorization', `Bearer ${token1}`).send({ answer: 'yes' }).expect(200);
    }

    // Wait 15 seconds to be sure
    await new Promise(resolve => setTimeout(resolve, 15000));

    // Get game - should be Finished
    const gameResp = await request(app.getHttpServer())
        .get(`/pair-game-quiz/pairs/${join1.body.id}`)
        .set('Authorization', `Bearer ${token1}`)
        .expect(200);
    
    expect(gameResp.body.status).toBe('Finished');
    expect(gameResp.body.secondPlayerProgress.answers).toHaveLength(5);
    expect(gameResp.body.secondPlayerProgress.score).toBe(0);
    expect(gameResp.body.firstPlayerProgress.score).toBe(6); // 5 + 1 bonus
  }, 90000);
});
