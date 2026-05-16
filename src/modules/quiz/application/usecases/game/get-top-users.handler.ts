import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { QuizGameQueryRepository } from '../../../infrastructure/quiz-game.query-repository';
import { TopUsersQueryParams } from '../../../api/dto/top-users-query.dto';

export class GetTopUsersQuery {
  constructor(public readonly queryParams: TopUsersQueryParams) {}
}

@QueryHandler(GetTopUsersQuery)
export class GetTopUsersHandler implements IQueryHandler<GetTopUsersQuery> {
  constructor(private readonly queryRepository: QuizGameQueryRepository) {}

  async execute(query: GetTopUsersQuery) {
    return this.queryRepository.getTopUsers(query.queryParams);
  }
}
