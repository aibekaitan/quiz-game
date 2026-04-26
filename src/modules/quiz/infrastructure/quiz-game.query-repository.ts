import { Injectable } from '@nestjs/common';
import { QuizGame, GameStatus } from '../domain/quiz-game.entity';
import {
  GameViewModel,
  PlayerProgressViewModel,
  AnswerViewModel,
} from '../api/dto/quiz-game.dto';
import { QuizPlayerProgress } from '../domain/quiz-player-progress.entity';

@Injectable()
export class QuizGameQueryRepository {
  mapGameToView(game: QuizGame): GameViewModel {
    return {
      id: game.id,
      firstPlayerProgress: this.mapPlayerProgressToView(
        game.firstPlayerProgress,
      ),
      secondPlayerProgress: game.secondPlayerProgress
        ? this.mapPlayerProgressToView(game.secondPlayerProgress)
        : null,
      questions:
        game.questions && game.questions.length > 0
          ? game.questions
              .sort((a, b) => a.id.localeCompare(b.id))
              .map((q) => ({ id: q.id, body: q.body }))
          : null,
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
        ? progress.answers
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
