import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { QuizGameQueryRepository } from '../../../infrastructure/quiz-game.query-repository';
import { TopUsersQueryParams } from '../../../api/dto/top-users-query.dto';
import { QuizGameService } from '../../quiz-game.service';

export class GetTopUsersQuery {
  constructor(public readonly queryParams: TopUsersQueryParams) {}
}

@QueryHandler(GetTopUsersQuery)
export class GetTopUsersHandler implements IQueryHandler<GetTopUsersQuery> {
  constructor(
    private readonly queryRepository: QuizGameQueryRepository,
    private readonly gameService: QuizGameService,
  ) {}

  async execute(query: GetTopUsersQuery) {
    await this.gameService.finishAllExpiredGames();
    return this.queryRepository.getTopUsers(query.queryParams);
  }
}
