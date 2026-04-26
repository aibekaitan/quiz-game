import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';

describe('SA Quiz Questions (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    const { appSetup } = require('../src/setup/app.setup');
    appSetup(app);
    await app.init();
  }, 60000);

  afterAll(async () => {
    if (app) await app.close();
  });

  beforeEach(async () => {
    await request(app.getHttpServer()).delete('/testing/all-data');
  });

  const adminAuth = 'Basic ' + Buffer.from('admin:qwerty').toString('base64');

  it('SA CRUD: Create, Update, Publish, Delete, Filter', async () => {
    // 1. Create Question
    const createResp = await request(app.getHttpServer())
      .post('/sa/quiz/questions')
      .set('Authorization', adminAuth)
      .send({ body: 'What is 2+2? Wait for it...', correctAnswers: ['4', 'four'] })
      .expect(201);
    
    expect(createResp.body.body).toBe('What is 2+2? Wait for it...');
    const qId = createResp.body.id;

    // 2. Update Question
    await request(app.getHttpServer())
      .put(`/sa/quiz/questions/${qId}`)
      .set('Authorization', adminAuth)
      .send({ body: 'What is 2+2?', correctAnswers: ['4', 'four'] })
      .expect(204);

    // 3. Publish Question
    await request(app.getHttpServer())
      .put(`/sa/quiz/questions/${qId}/publish`)
      .set('Authorization', adminAuth)
      .send({ published: true })
      .expect(204);

    // 4. Get and check filtering
    const getResp = await request(app.getHttpServer())
      .get('/sa/quiz/questions')
      .set('Authorization', adminAuth)
      .query({ publishedStatus: 'published', bodySearchTerm: '2+2' })
      .expect(200);

    expect(getResp.body.items).toHaveLength(1);
    expect(getResp.body.items[0].published).toBe(true);

    // 5. Delete Question
    await request(app.getHttpServer())
      .delete(`/sa/quiz/questions/${qId}`)
      .set('Authorization', adminAuth)
      .expect(204);

    // 6. Verify Deleted
    const getFinalResp = await request(app.getHttpServer())
      .get('/sa/quiz/questions')
      .set('Authorization', adminAuth)
      .expect(200);
    expect(getFinalResp.body.items).toHaveLength(0);
  }, 30000);
});
