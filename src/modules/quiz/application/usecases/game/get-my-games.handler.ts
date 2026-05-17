import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { QuizGameQueryRepository } from '../../../infrastructure/quiz-game.query-repository';
import { MyGamesQueryParams } from '../../../api/dto/my-games-query.dto';
import { QuizGameService } from '../../quiz-game.service';
import { QuizGameRepository } from '../../../infrastructure/quiz-game.repository';

export class GetMyGamesQuery {
  constructor(
    public readonly userId: string,
    public readonly queryParams: MyGamesQueryParams,
  ) {}
}

@QueryHandler(GetMyGamesQuery)
export class GetMyGamesHandler implements IQueryHandler<GetMyGamesQuery> {
  constructor(
    private readonly queryRepository: QuizGameQueryRepository,
    private readonly gameService: QuizGameService,
    private readonly gameRepository: QuizGameRepository,
  ) {}

  async execute(query: GetMyGamesQuery) {
    // Optional: lazy check all active games for this user to ensure stats are fresh
    const activeGame = await this.gameRepository.findActiveGameByUserId(query.userId);
    if (activeGame) {
        await this.gameService.checkAndFinishGame(activeGame);
    }

    return this.queryRepository.getMyGames(query.userId, query.queryParams);
  }
}
