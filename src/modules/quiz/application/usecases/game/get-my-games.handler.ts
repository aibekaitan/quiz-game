import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { QuizGameQueryRepository } from '../../../infrastructure/quiz-game.query-repository';
import { MyGamesQueryParams } from '../../../api/dto/my-games-query.dto';

export class GetMyGamesQuery {
  constructor(
    public readonly userId: string,
    public readonly queryParams: MyGamesQueryParams,
  ) {}
}

@QueryHandler(GetMyGamesQuery)
export class GetMyGamesHandler implements IQueryHandler<GetMyGamesQuery> {
  constructor(private readonly queryRepository: QuizGameQueryRepository) {}

  async execute(query: GetMyGamesQuery) {
    return this.queryRepository.getMyGames(query.userId, query.queryParams);
  }
}
