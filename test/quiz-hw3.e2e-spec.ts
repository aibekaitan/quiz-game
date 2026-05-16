import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { DataSource } from 'typeorm';
import { CoreConfig } from './../src/core/core.config';

describe('Quiz Game HW3 (e2e)', () => {
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

  it('GET /pair-game-quiz/users/top - should return top players', async () => {
    // 1. Create users
    const u1 = await createUser('user1', 'u1@test.com');
    const u2 = await createUser('user2', 'u2@test.com');
    const u3 = await createUser('user3', 'u3@test.com');

    const t1 = await login('user1');
    const t2 = await login('user2');
    const t3 = await login('user3');

    // 2. Create questions
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

    // 3. Play Games
    // Game 1: User 1 vs User 2. User 1 wins (5-0)
    await request(app.getHttpServer()).post('/pair-game-quiz/pairs/connection').set('Authorization', `Bearer ${t1}`).expect(200);
    await request(app.getHttpServer()).post('/pair-game-quiz/pairs/connection').set('Authorization', `Bearer ${t2}`).expect(200);
    for (let i = 0; i < 5; i++) {
        await request(app.getHttpServer()).post('/pair-game-quiz/pairs/my-current/answers').set('Authorization', `Bearer ${t1}`).send({ answer: 'yes' }).expect(200);
        await request(app.getHttpServer()).post('/pair-game-quiz/pairs/my-current/answers').set('Authorization', `Bearer ${t2}`).send({ answer: 'no' }).expect(200);
    }

    // Game 2: User 1 vs User 3. User 1 wins (5-0)
    await request(app.getHttpServer()).post('/pair-game-quiz/pairs/connection').set('Authorization', `Bearer ${t1}`).expect(200);
    await request(app.getHttpServer()).post('/pair-game-quiz/pairs/connection').set('Authorization', `Bearer ${t3}`).expect(200);
    for (let i = 0; i < 5; i++) {
        await request(app.getHttpServer()).post('/pair-game-quiz/pairs/my-current/answers').set('Authorization', `Bearer ${t1}`).send({ answer: 'yes' }).expect(200);
        await request(app.getHttpServer()).post('/pair-game-quiz/pairs/my-current/answers').set('Authorization', `Bearer ${t3}`).send({ answer: 'no' }).expect(200);
    }

    // User 1: 2 games, 2 wins, 0 losses, 0 draws, sumScore 12 (5+5+1+1), avg 6.0
    // User 2: 1 game, 0 wins, 1 loss, 0 draws, sumScore 0, avg 0.0
    // User 3: 1 game, 0 wins, 1 loss, 0 draws, sumScore 0, avg 0.0

    // 4. Check Top
    const topResp = await request(app.getHttpServer())
        .get('/pair-game-quiz/users/top')
        .query({ sort: ['avgScores desc', 'sumScore desc'] })
        .expect(200);

    expect(topResp.body.items).toHaveLength(3);
    expect(topResp.body.items[0].player.login).toBe('user1');
    expect(topResp.body.items[0].winsCount).toBe(2);
    expect(topResp.body.items[0].sumScore).toBe(12);
  }, 90000);
});
