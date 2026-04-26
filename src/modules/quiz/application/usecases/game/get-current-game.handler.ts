import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { QuizGameRepository } from '../../../infrastructure/quiz-game.repository';
import { QuizGameQueryRepository } from '../../../infrastructure/quiz-game.query-repository';
import { NotFoundException } from '@nestjs/common';

export class GetCurrentGameQuery {
  constructor(public readonly userId: string) {}
}

@QueryHandler(GetCurrentGameQuery)
export class GetCurrentGameHandler implements IQueryHandler<GetCurrentGameQuery> {
  constructor(
    private readonly gameRepository: QuizGameRepository,
    private readonly queryRepository: QuizGameQueryRepository,
  ) {}

  async execute(query: GetCurrentGameQuery) {
    const game = await this.gameRepository.findActiveGameByUserId(query.userId);
    if (!game) {
      throw new NotFoundException('No active or pending game found for current user');
    }
    return this.queryRepository.mapGameToView(game);
  }
}
