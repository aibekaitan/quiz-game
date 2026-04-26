import { Test, TestingModule } from '@nestjs/testing';
import { SubmitAnswerHandler, SubmitAnswerCommand } from './submit-answer.handler';
import { QuizGameRepository } from '../../../infrastructure/quiz-game.repository';
import { GameStatus, QuizGame } from '../../../domain/quiz-game.entity';
import { AnswerStatus, QuizAnswer, QuizPlayerProgress } from '../../../domain/quiz-player-progress.entity';
import { ForbiddenException } from '@nestjs/common';

describe('SubmitAnswerHandler', () => {
  let handler: SubmitAnswerHandler;
  let gameRepository: jest.Mocked<QuizGameRepository>;

  beforeEach(async () => {
    const mockGameRepository = {
      findActiveGameByUserId: jest.fn(),
      save: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubmitAnswerHandler,
        {
          provide: QuizGameRepository,
          useValue: mockGameRepository,
        },
      ],
    }).compile();

    handler = module.get<SubmitAnswerHandler>(SubmitAnswerHandler);
    gameRepository = module.get(QuizGameRepository);
  });

  it('should throw ForbiddenException if user is not in an active game', async () => {
    gameRepository.findActiveGameByUserId.mockResolvedValue(null);

    await expect(
      handler.execute(new SubmitAnswerCommand('user1', { answer: 'correct' })),
    ).rejects.toThrow(ForbiddenException);
  });

  it('should correctly score a correct answer', async () => {
    const userId = 'user1';
    const progress = QuizPlayerProgress.create(userId);
    const game = new QuizGame();
    game.status = GameStatus.ACTIVE;
    game.firstPlayerProgress = progress;
    game.secondPlayerProgress = QuizPlayerProgress.create('user2');
    game.questions = [
      { id: 'q1', correctAnswers: ['correct'], body: 'q1 body' } as any,
    ];

    gameRepository.findActiveGameByUserId.mockResolvedValue(game);
    gameRepository.save.mockResolvedValue(game);

    const result = await handler.execute(
      new SubmitAnswerCommand(userId, { answer: 'correct' }),
    );

    expect(result.answerStatus).toBe(AnswerStatus.CORRECT);
    expect(progress.score).toBe(1);
    expect(progress.answers).toHaveLength(1);
  });

  it('should correctly score an incorrect answer', async () => {
    const userId = 'user1';
    const progress = QuizPlayerProgress.create(userId);
    const game = new QuizGame();
    game.status = GameStatus.ACTIVE;
    game.firstPlayerProgress = progress;
    game.secondPlayerProgress = QuizPlayerProgress.create('user2');
    game.questions = [
      { id: 'q1', correctAnswers: ['correct'], body: 'q1 body' } as any,
    ];

    gameRepository.findActiveGameByUserId.mockResolvedValue(game);
    gameRepository.save.mockResolvedValue(game);

    const result = await handler.execute(
      new SubmitAnswerCommand(userId, { answer: 'wrong' }),
    );

    expect(result.answerStatus).toBe(AnswerStatus.INCORRECT);
    expect(progress.score).toBe(0);
  });

  it('should finish game and award bonus point to faster player', async () => {
    const user1Id = 'user1';
    const user2Id = 'user2';
    
    const p1 = QuizPlayerProgress.create(user1Id);
    // User 1 already answered 4 questions (all correct)
    for (let i = 0; i < 4; i++) {
        const ans = new QuizAnswer();
        ans.answerStatus = AnswerStatus.CORRECT;
        ans.addedAt = new Date(Date.now() - 10000);
        p1.answers.push(ans);
        p1.score++;
    }

    const p2 = QuizPlayerProgress.create(user2Id);
    // User 2 already answered 5 questions (1 correct)
    for (let i = 0; i < 5; i++) {
        const ans = new QuizAnswer();
        ans.answerStatus = i === 0 ? AnswerStatus.CORRECT : AnswerStatus.INCORRECT;
        ans.addedAt = new Date(Date.now() - 5000); // Finished 5 seconds ago
        p2.answers.push(ans);
        if (i === 0) p2.score++;
    }

    const game = new QuizGame();
    game.status = GameStatus.ACTIVE;
    game.firstPlayerProgress = p1;
    game.secondPlayerProgress = p2;
    game.questions = Array(5).fill({ id: 'q', correctAnswers: ['correct'] });

    gameRepository.findActiveGameByUserId.mockResolvedValue(game);
    gameRepository.save.mockResolvedValue(game);

    // User 1 submits their 5th answer NOW (later than User 2)
    await handler.execute(new SubmitAnswerCommand(user1Id, { answer: 'correct' }));

    expect(game.status).toBe(GameStatus.FINISHED);
    expect(game.finishGameDate).toBeDefined();
    
    // User 2 finished first and has 1 correct answer, so they get +1 bonus
    expect(p2.score).toBe(2); // 1 original + 1 bonus
    expect(p1.score).toBe(5); // 5 original + 0 bonus
  });
});
