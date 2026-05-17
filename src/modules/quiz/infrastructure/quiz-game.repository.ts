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

  async findAllActiveGamesWithFinisher(): Promise<QuizGame[]> {
      // Find games that are ACTIVE and have a first finisher date
      return this.gameRepo
        .createQueryBuilder('g')
        .leftJoinAndSelect('g.firstPlayerProgress', 'p1')
        .leftJoinAndSelect('p1.answers', 'a1')
        .leftJoinAndSelect('g.secondPlayerProgress', 'p2')
        .leftJoinAndSelect('p2.answers', 'a2')
        .leftJoinAndSelect('g.questions', 'q')
        .where('g.status = :status', { status: GameStatus.ACTIVE })
        .andWhere('g.firstFinisherDate IS NOT NULL')
        .getMany();
  }
}
