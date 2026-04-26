import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { QuizGameRepository } from '../../../infrastructure/quiz-game.repository';
import { QuizGameQueryRepository } from '../../../infrastructure/quiz-game.query-repository';
import { ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import { validate as isUuid } from 'uuid';

export class GetGameByIdQuery {
  constructor(
    public readonly gameId: string,
    public readonly userId: string,
  ) {}
}

@QueryHandler(GetGameByIdQuery)
export class GetGameByIdHandler implements IQueryHandler<GetGameByIdQuery> {
  constructor(
    private readonly gameRepository: QuizGameRepository,
    private readonly queryRepository: QuizGameQueryRepository,
  ) {}

  async execute(query: GetGameByIdQuery) {
    if (!isUuid(query.gameId)) {
        throw new BadRequestException('Invalid game ID format');
    }

    const game = await this.gameRepository.findById(query.gameId);
    if (!game) {
      throw new NotFoundException('Game not found');
    }

    const isParticipant =
      game.firstPlayerProgress.userId === query.userId ||
      game.secondPlayerProgress?.userId === query.userId;

    if (!isParticipant) {
      throw new ForbiddenException('User is not a participant of this game');
    }

    return this.queryRepository.mapGameToView(game);
  }
}
