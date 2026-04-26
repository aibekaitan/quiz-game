import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { QuizGame, GameStatus } from '../domain/quiz-game.entity';
import { QuizPlayerProgress } from '../domain/quiz-player-progress.entity';

@Injectable()
export class QuizGameRepository {
  constructor(
    @InjectRepository(QuizGame)
    private readonly gameRepo: Repository<QuizGame>,
    @InjectRepository(QuizPlayerProgress)
    private readonly progressRepo: Repository<QuizPlayerProgress>,
  ) {}

  async save(game: QuizGame): Promise<QuizGame> {
    return this.gameRepo.save(game);
  }

  async findById(id: string): Promise<QuizGame | null> {
    return this.gameRepo.findOne({
      where: { id },
      relations: [
        'firstPlayerProgress',
        'firstPlayerProgress.user',
        'firstPlayerProgress.answers',
        'secondPlayerProgress',
        'secondPlayerProgress.user',
        'secondPlayerProgress.answers',
        'questions',
      ],
    });
  }

  async findPendingGame(): Promise<QuizGame | null> {
    return this.gameRepo.findOne({
      where: { status: GameStatus.PENDING_SECOND_PLAYER },
      relations: [
        'firstPlayerProgress',
        'firstPlayerProgress.user',
        'questions',
      ],
    });
  }

  async findActiveGameByUserId(userId: string): Promise<QuizGame | null> {
    return this.gameRepo.findOne({
      where: [
        { firstPlayerProgress: { userId }, status: GameStatus.ACTIVE },
        { secondPlayerProgress: { userId }, status: GameStatus.ACTIVE },
        { firstPlayerProgress: { userId }, status: GameStatus.PENDING_SECOND_PLAYER },
        { secondPlayerProgress: { userId }, status: GameStatus.PENDING_SECOND_PLAYER },
      ],
      relations: [
        'firstPlayerProgress',
        'firstPlayerProgress.user',
        'firstPlayerProgress.answers',
        'secondPlayerProgress',
        'secondPlayerProgress.user',
        'secondPlayerProgress.answers',
        'questions',
      ],
    });
  }
  
  async findAnyGameByUserId(userId: string, gameId: string): Promise<QuizGame | null> {
      return this.gameRepo.findOne({
          where: [
              { id: gameId, firstPlayerProgress: { userId } },
              { id: gameId, secondPlayerProgress: { userId } },
          ],
          relations: [
              'firstPlayerProgress',
              'firstPlayerProgress.user',
              'firstPlayerProgress.answers',
              'secondPlayerProgress',
              'secondPlayerProgress.user',
              'secondPlayerProgress.answers',
              'questions',
          ],
      });
  }
}
