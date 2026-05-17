import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { QuizGameRepository } from '../../../infrastructure/quiz-game.repository';
import { QuizGameQueryRepository } from '../../../infrastructure/quiz-game.query-repository';
import { NotFoundException } from '@nestjs/common';
import { QuizGameService } from '../../quiz-game.service';
import { GameStatus } from '../../../domain/quiz-game.entity';

export class GetCurrentGameQuery {
  constructor(public readonly userId: string) {}
}

@QueryHandler(GetCurrentGameQuery)
export class GetCurrentGameHandler implements IQueryHandler<GetCurrentGameQuery> {
  constructor(
    private readonly gameRepository: QuizGameRepository,
    private readonly queryRepository: QuizGameQueryRepository,
    private readonly gameService: QuizGameService,
  ) {}

  async execute(query: GetCurrentGameQuery) {
    let game = await this.gameRepository.findActiveGameByUserId(query.userId);
    if (!game) {
      throw new NotFoundException('No active or pending game found for current user');
    }

    game = await this.gameService.checkAndFinishGame(game);
    if (game.status === GameStatus.FINISHED) {
        throw new NotFoundException('No active or pending game found for current user');
    }

    return this.queryRepository.mapGameToView(game);
  }
}

