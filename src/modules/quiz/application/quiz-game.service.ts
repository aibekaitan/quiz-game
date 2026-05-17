import { Injectable } from '@nestjs/common';
import { QuizGameRepository } from '../infrastructure/quiz-game.repository';
import { GameStatus, QuizGame } from '../domain/quiz-game.entity';
import { AnswerStatus, QuizAnswer, QuizPlayerProgress } from '../domain/quiz-player-progress.entity';

@Injectable()
export class QuizGameService {
  constructor(private readonly gameRepository: QuizGameRepository) {}

  /**
   * Checks if the game should be finished due to the 10-second rule.
   * If yes, closes the game and fills missing answers.
   */
  async checkAndFinishGame(game: QuizGame): Promise<QuizGame> {
    if (game.status !== GameStatus.ACTIVE) return game;

    const p1Answers = game.firstPlayerProgress.answers || [];
    const p2Answers = game.secondPlayerProgress?.answers || [];

    const p1Finished = p1Answers.length === 5;
    const p2Finished = p2Answers.length === 5;

    // Both finished - ensure status is Finished
    if (p1Finished && p2Finished) {
      return this.finishGame(game);
    }

    if (!game.firstFinisherDate) return game;

    const now = new Date();
    const diffMs = now.getTime() - new Date(game.firstFinisherDate).getTime();

    // 10 seconds rule
    if (diffMs >= 10000) {
      return this.finishGame(game);
    }

    return game;
  }

  /**
   * Transitions game to Finished status, fills missing answers, and awards bonus.
   */
  async finishGame(game: QuizGame): Promise<QuizGame> {
    if (game.status === GameStatus.FINISHED) return game;

    game.status = GameStatus.FINISHED;
    game.finishGameDate = new Date();

    const sortedQuestions = [...(game.questions || [])].sort((a, b) =>
      a.id.localeCompare(b.id),
    );

    const fillMissingAnswers = (progress: QuizPlayerProgress) => {
      if (!progress.answers) progress.answers = [];
      while (progress.answers.length < 5) {
        const questionIndex = progress.answers.length;
        const question = sortedQuestions[questionIndex];

        const answer = new QuizAnswer();
        answer.questionId = question.id;
        answer.answerStatus = AnswerStatus.INCORRECT;
        answer.addedAt = new Date();
        answer.progress = progress;

        progress.answers.push(answer);
      }
    };

    fillMissingAnswers(game.firstPlayerProgress);
    if (game.secondPlayerProgress) {
        fillMissingAnswers(game.secondPlayerProgress);
    }

    // Calculate bonus point
    const firstToFinish = this.getFasterPlayer(game);
    if (firstToFinish) {
      const hasCorrect = firstToFinish.answers.some(
        (a) => a.answerStatus === AnswerStatus.CORRECT,
      );
      if (hasCorrect) {
        firstToFinish.score += 1;
      }
    }

    await this.gameRepository.save(game);
    
    // Re-fetch to ensure all relations and IDs are correctly populated for view model
    const finishedGame = await this.gameRepository.findById(game.id);
    return finishedGame || game;
  }

  /**
   * Finds and finishes all active games where the 10-second rule should have triggered.
   */
  async finishAllExpiredGames(): Promise<void> {
      const activeGames = await this.gameRepository.findAllActiveGamesWithFinisher();
      for (const game of activeGames) {
          await this.checkAndFinishGame(game);
      }
  }

  private getFinishTime(answers: QuizAnswer[]): Date {
    const sorted = [...answers].sort((a, b) => {
        const t1 = new Date(a.addedAt).getTime();
        const t2 = new Date(b.addedAt).getTime();
        return t1 - t2;
    });
    return new Date(sorted[4].addedAt);
  }

  private getFasterPlayer(game: QuizGame) {
    const p1Answers = game.firstPlayerProgress.answers;
    const p2Answers = game.secondPlayerProgress?.answers;

    if (!p1Answers || p1Answers.length !== 5 || !p2Answers || p2Answers.length !== 5) return null;

    const t1 = this.getFinishTime(p1Answers).getTime();
    const t2 = this.getFinishTime(p2Answers).getTime();

    if (t1 < t2) {
      return game.firstPlayerProgress;
    } else if (t2 < t1) {
      return game.secondPlayerProgress;
    }
    return null;
  }
}
