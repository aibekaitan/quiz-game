import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { DataSource } from 'typeorm';

describe('Quiz Game (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

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

  it('Full Game Flow: Join, Answer, Finish', async () => {
    // 1. Create 2 users
    const user1 = await createUser('user1', 'user1@test.com');
    const user2 = await createUser('user2', 'user2@test.com');

    const token1 = await login('user1');
    const token2 = await login('user2');

    // 2. SA creates and publishes 5 questions
    for (let i = 1; i <= 5; i++) {
        const qResp = await request(app.getHttpServer())
            .post('/sa/quiz/questions')
            .set('Authorization', adminAuth)
            .send({ body: `Question ${i} ??????????`, correctAnswers: [`ans${i}`] })
            .expect(201);
        
        await request(app.getHttpServer())
            .put(`/sa/quiz/questions/${qResp.body.id}/publish`)
            .set('Authorization', adminAuth)
            .send({ published: true })
            .expect(204);
    }

    // 3. User 1 joins (Pending)
    const join1 = await request(app.getHttpServer())
        .post('/pair-game-quiz/pairs/connection')
        .set('Authorization', `Bearer ${token1}`)
        .expect(200);
    
    expect(join1.body.status).toBe('PendingSecondPlayer');
    expect(join1.body.firstPlayerProgress.player.id).toBe(user1.id);
    expect(join1.body.secondPlayerProgress).toBeNull();

    // 4. User 2 joins (Active)
    const join2 = await request(app.getHttpServer())
        .post('/pair-game-quiz/pairs/connection')
        .set('Authorization', `Bearer ${token2}`)
        .expect(200);

    expect(join2.body.status).toBe('Active');
    expect(join2.body.secondPlayerProgress.player.id).toBe(user2.id);
    expect(join2.body.questions).toHaveLength(5);

    // 5. Submit answers
    // User 1 answers all 5 correctly
    for (let i = 0; i < 5; i++) {
        const body = join2.body.questions[i].body;
        const index = body.match(/\d+/)[0];
        const correctAns = `ans${index}`;

        await request(app.getHttpServer())
            .post('/pair-game-quiz/pairs/my-current/answers')
            .set('Authorization', `Bearer ${token1}`)
            .send({ answer: correctAns })
            .expect(200);
    }

    // User 2 answers all 5 incorrectly
    for (let i = 0; i < 5; i++) {
        await request(app.getHttpServer())
            .post('/pair-game-quiz/pairs/my-current/answers')
            .set('Authorization', `Bearer ${token2}`)
            .send({ answer: 'wrong' })
            .expect(200);
    }

    // 6. Check final status
    const finalGame = await request(app.getHttpServer())
        .get(`/pair-game-quiz/pairs/${join1.body.id}`)
        .set('Authorization', `Bearer ${token1}`)
        .expect(200);

    expect(finalGame.body.status).toBe('Finished');
    expect(finalGame.body.firstPlayerProgress.score).toBe(6); // 5 correct + 1 bonus (finished first)
    expect(finalGame.body.secondPlayerProgress.score).toBe(0);
  }, 60000);
});
