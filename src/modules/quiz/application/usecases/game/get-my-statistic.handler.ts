import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { QuizGameQueryRepository } from '../../../infrastructure/quiz-game.query-repository';
import { QuizGameService } from '../../quiz-game.service';
import { QuizGameRepository } from '../../../infrastructure/quiz-game.repository';

export class GetMyStatisticQuery {
  constructor(public readonly userId: string) {}
}

@QueryHandler(GetMyStatisticQuery)
export class GetMyStatisticHandler implements IQueryHandler<GetMyStatisticQuery> {
  constructor(
    private readonly queryRepository: QuizGameQueryRepository,
    private readonly gameService: QuizGameService,
    private readonly gameRepository: QuizGameRepository,
  ) {}

  async execute(query: GetMyStatisticQuery) {
    const activeGame = await this.gameRepository.findActiveGameByUserId(query.userId);
    if (activeGame) {
        await this.gameService.checkAndFinishGame(activeGame);
    }
    return this.queryRepository.getMyStatistic(query.userId);
  }
}
