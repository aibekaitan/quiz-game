import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { QuizGame, GameStatus } from '../domain/quiz-game.entity';
import {
  GameViewModel,
  PlayerProgressViewModel,
  AnswerViewModel,
} from '../api/dto/quiz-game.dto';
import { QuizPlayerProgress } from '../domain/quiz-player-progress.entity';
import { MyGamesQueryParams } from '../api/dto/my-games-query.dto';
import { MyStatisticViewModel } from '../api/dto/my-statistic.view-dto';
import { TopUsersQueryParams } from '../api/dto/top-users-query.dto';
import { TopGamePlayerViewModel } from '../api/dto/top-game-player.view-dto';
import { Paginator } from '../../../core/types/paginator';

@Injectable()
export class QuizGameQueryRepository {
  constructor(private readonly dataSource: DataSource) {}

  async getTopUsers(queryParams: TopUsersQueryParams): Promise<Paginator<TopGamePlayerViewModel>> {
    const { sort, pageNumber, pageSize } = queryParams;

    const queryBuilder = this.dataSource
      .getRepository(QuizPlayerProgress)
      .createQueryBuilder('p')
      .innerJoin('quiz_games', 'g', 'p.id = g."firstPlayerProgressId" OR p.id = g."secondPlayerProgressId"')
      .leftJoin('p.user', 'u')
      .select('u.id', 'id')
      .addSelect('u.login', 'login')
      .addSelect('SUM(p.score)', 'sumScore')
      .addSelect('COUNT(g.id)', 'gamesCount')
      .addSelect('AVG(p.score)::numeric', 'avgScores')
      // Wins: My score > Opponent's score. 
      .addSelect(
          (subQuery) => {
              return subQuery
                  .select('COUNT(*)')
                  .from('quiz_player_progress', 'p2')
                  .innerJoin('quiz_games', 'g2', 'p2."id" = g2."firstPlayerProgressId" OR p2."id" = g2."secondPlayerProgressId"')
                  .innerJoin('quiz_player_progress', 'p_opp', '(p_opp."id" = g2."firstPlayerProgressId" OR p_opp."id" = g2."secondPlayerProgressId") AND p_opp."id" != p2."id"')
                  .where('p2."userId" = u.id')
                  .andWhere('g2.status = :status', { status: GameStatus.FINISHED })
                  .andWhere('p2.score > p_opp.score');
          },
          'winsCount'
      )
      .addSelect(
          (subQuery) => {
              return subQuery
                  .select('COUNT(*)')
                  .from('quiz_player_progress', 'p2')
                  .innerJoin('quiz_games', 'g2', 'p2."id" = g2."firstPlayerProgressId" OR p2."id" = g2."secondPlayerProgressId"')
                  .innerJoin('quiz_player_progress', 'p_opp', '(p_opp."id" = g2."firstPlayerProgressId" OR p_opp."id" = g2."secondPlayerProgressId") AND p_opp."id" != p2."id"')
                  .where('p2."userId" = u.id')
                  .andWhere('g2.status = :status', { status: GameStatus.FINISHED })
                  .andWhere('p2.score < p_opp.score');
          },
          'lossesCount'
      )
      .addSelect(
          (subQuery) => {
              return subQuery
                  .select('COUNT(*)')
                  .from('quiz_player_progress', 'p2')
                  .innerJoin('quiz_games', 'g2', 'p2."id" = g2."firstPlayerProgressId" OR p2."id" = g2."secondPlayerProgressId"')
                  .innerJoin('quiz_player_progress', 'p_opp', '(p_opp."id" = g2."firstPlayerProgressId" OR p_opp."id" = g2."secondPlayerProgressId") AND p_opp."id" != p2."id"')
                  .where('p2."userId" = u.id')
                  .andWhere('g2.status = :status', { status: GameStatus.FINISHED })
                  .andWhere('p2.score = p_opp.score');
          },
          'drawsCount'
      )
      .where('g.status = :finishedStatus', { finishedStatus: GameStatus.FINISHED })
      .groupBy('u.id')
      .addGroupBy('u.login');

    // Handle multi-criteria sorting
    const sorts = Array.isArray(sort) ? sort : [sort];
    sorts.forEach((s) => {
      const [field, direction] = s.split(' ');
      queryBuilder.addOrderBy(`"${field}"`, direction.toUpperCase() as 'ASC' | 'DESC');
    });

    const rawResults = await queryBuilder
      .offset((pageNumber - 1) * pageSize)
      .limit(pageSize)
      .getRawMany();

    const totalCountResult = await this.dataSource
        .getRepository(QuizPlayerProgress)
        .createQueryBuilder('p')
        .innerJoin('quiz_games', 'g', 'p.id = g."firstPlayerProgressId" OR p.id = g."secondPlayerProgressId"')
        .where('g.status = :status', { status: GameStatus.FINISHED })
        .select('COUNT(DISTINCT p."userId")', 'count')
        .getRawOne();
    
    const totalCount = parseInt(totalCountResult.count, 10);

    return {
      pagesCount: Math.ceil(totalCount / pageSize),
      page: pageNumber,
      pageSize: pageSize,
      totalCount: totalCount,
      items: rawResults.map((r) => ({
        sumScore: parseInt(r.sumScore, 10),
        avgScores: Math.round(parseFloat(r.avgScores) * 100) / 100,
        gamesCount: parseInt(r.gamesCount, 10),
        winsCount: parseInt(r.winsCount, 10),
        lossesCount: parseInt(r.lossesCount, 10),
        drawsCount: parseInt(r.drawsCount, 10),
        player: {
          id: r.id,
          login: r.login,
        },
      })),
    };
  }

  async getMyGames(userId: string, queryParams: MyGamesQueryParams): Promise<Paginator<GameViewModel>> {
    const { pageNumber, pageSize, sortBy, sortDirection } = queryParams;

    // Use QueryBuilder for complex sorting and filtering
    const queryBuilder = this.dataSource
      .getRepository(QuizGame)
      .createQueryBuilder('g')
      .leftJoinAndSelect('g.firstPlayerProgress', 'p1')
      .leftJoinAndSelect('p1.user', 'u1')
      .leftJoinAndSelect('p1.answers', 'a1')
      .leftJoinAndSelect('g.secondPlayerProgress', 'p2')
      .leftJoinAndSelect('p2.user', 'u2')
      .leftJoinAndSelect('p2.answers', 'a2')
      .leftJoinAndSelect('g.questions', 'q')
      .where('p1.userId = :userId OR p2.userId = :userId', { userId });

    // Apply sorting
    // If sortBy is a progress field, we might need special handling, but the swagger says pairCreatedDate, etc.
    // "если по первому критерию одинаковые значения - сортируем по pairCreatedDate desc"
    const orderDirection = sortDirection.toUpperCase() as 'ASC' | 'DESC';
    
    if (sortBy !== 'pairCreatedDate') {
        queryBuilder.orderBy(`g.${sortBy}`, orderDirection);
        queryBuilder.addOrderBy('g.pairCreatedDate', 'DESC');
    } else {
        queryBuilder.orderBy('g.pairCreatedDate', orderDirection);
    }

    const totalCount = await queryBuilder.getCount();
    const games = await queryBuilder
      .skip((pageNumber - 1) * pageSize)
      .take(pageSize)
      .getMany();

    return {
      pagesCount: Math.ceil(totalCount / pageSize),
      page: pageNumber,
      pageSize: pageSize,
      totalCount: totalCount,
      items: games.map((g) => this.mapGameToView(g)),
    };
  }

  async getMyStatistic(userId: string): Promise<MyStatisticViewModel> {
    const games = await this.dataSource
      .getRepository(QuizGame)
      .createQueryBuilder('g')
      .leftJoinAndSelect('g.firstPlayerProgress', 'p1')
      .leftJoinAndSelect('g.secondPlayerProgress', 'p2')
      .where('g.status = :status', { status: GameStatus.FINISHED })
      .andWhere('(p1.userId = :userId OR p2.userId = :userId)', { userId })
      .getMany();

    let sumScore = 0;
    let winsCount = 0;
    let lossesCount = 0;
    let drawsCount = 0;

    for (const game of games) {
      const isFirstPlayer = game.firstPlayerProgress.userId === userId;
      const myProgress = isFirstPlayer ? game.firstPlayerProgress : game.secondPlayerProgress!;
      const otherProgress = isFirstPlayer ? game.secondPlayerProgress! : game.firstPlayerProgress;

      sumScore += myProgress.score;

      if (myProgress.score > otherProgress.score) {
        winsCount++;
      } else if (myProgress.score < otherProgress.score) {
        lossesCount++;
      } else {
        drawsCount++;
      }
    }

    const gamesCount = games.length;
    const avgScores = gamesCount > 0 ? Number((sumScore / gamesCount).toFixed(2)) : 0;

    return {
      sumScore,
      avgScores,
      gamesCount,
      winsCount,
      lossesCount,
      drawsCount,
    };
  }

  mapGameToView(game: QuizGame): GameViewModel {
    const questions = game.questions && game.questions.length > 0
        ? [...game.questions]
            .sort((a, b) => a.id.localeCompare(b.id))
            .map((q) => ({ id: q.id, body: q.body }))
        : null;

    return {
      id: game.id,
      firstPlayerProgress: this.mapPlayerProgressToView(
        game.firstPlayerProgress,
      ),
      secondPlayerProgress: game.secondPlayerProgress
        ? this.mapPlayerProgressToView(game.secondPlayerProgress)
        : null,
      questions,
      status: game.status,
      pairCreatedDate: game.pairCreatedDate.toISOString(),
      startGameDate: game.startGameDate
        ? game.startGameDate.toISOString()
        : null,
      finishGameDate: game.finishGameDate
        ? game.finishGameDate.toISOString()
        : null,
    };
  }

  private mapPlayerProgressToView(
    progress: QuizPlayerProgress,
  ): PlayerProgressViewModel {
    return {
      answers: progress.answers
        ? [...progress.answers]
            .sort((a, b) => a.addedAt.getTime() - b.addedAt.getTime())
            .map((a) => ({
              questionId: a.questionId,
              answerStatus: a.answerStatus,
              addedAt: a.addedAt.toISOString(),
            }))
        : [],
      player: {
        id: progress.user.id,
        login: progress.user.login,
      },
      score: progress.score,
    };
  }
}
