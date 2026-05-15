import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { QuizGameQueryRepository } from '../../../infrastructure/quiz-game.query-repository';

export class GetMyStatisticQuery {
  constructor(public readonly userId: string) {}
}

@QueryHandler(GetMyStatisticQuery)
export class GetMyStatisticHandler implements IQueryHandler<GetMyStatisticQuery> {
  constructor(private readonly queryRepository: QuizGameQueryRepository) {}

  async execute(query: GetMyStatisticQuery) {
    return this.queryRepository.getMyStatistic(query.userId);
  }
}
