import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { QuizGameRepository } from '../../../infrastructure/quiz-game.repository';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { AnswerInputModel } from '../../../api/dto/quiz-game.dto';
import { GameStatus, QuizGame } from '../../../domain/quiz-game.entity';
import { QuizAnswer, AnswerStatus } from '../../../domain/quiz-player-progress.entity';

export class SubmitAnswerCommand {
  constructor(
    public readonly userId: string,
    public readonly dto: AnswerInputModel,
  ) {}
}

@CommandHandler(SubmitAnswerCommand)
export class SubmitAnswerHandler implements ICommandHandler<SubmitAnswerCommand> {
  constructor(private readonly gameRepository: QuizGameRepository) {}

  async execute(command: SubmitAnswerCommand) {
    const { userId, dto } = command;

    // 1. Find active game for user
    const game = await this.gameRepository.findActiveGameByUserId(userId);
    if (!game || game.status !== GameStatus.ACTIVE) {
      throw new ForbiddenException('User is not in an active game');
    }

    const isFirstPlayer = game.firstPlayerProgress.userId === userId;
    const progress = isFirstPlayer ? game.firstPlayerProgress : game.secondPlayerProgress!;
    const otherProgress = isFirstPlayer ? game.secondPlayerProgress! : game.firstPlayerProgress;

    // 2. Check if user already answered all questions
    if (progress.answers.length >= 5) {
      throw new ForbiddenException('User already answered all questions');
    }

    // 3. Determine current question
    const currentQuestionIndex = progress.answers.length;
    const question = game.questions![currentQuestionIndex];
    console.log('question:', JSON.stringify(question));
    console.log('correctAnswers:', question.correctAnswers);
    console.log('correctAnswers type:', typeof question.correctAnswers);
    // 4. Validate answer
    const isCorrect = question.correctAnswers.some(
      (ans) => ans.toLowerCase() === dto.answer.toLowerCase(),
    );

    // 5. Create answer
    const answer = new QuizAnswer();
    answer.questionId = question.id;
    answer.answerStatus = isCorrect ? AnswerStatus.CORRECT : AnswerStatus.INCORRECT;
    answer.addedAt = new Date();
    answer.progress = progress;

    progress.answers.push(answer);
    if (isCorrect) {
      progress.score += 1;
    }

    // 6. Check if both players finished
    console.log('=== FINISH CHECK ===');
    console.log('current player answers:', progress.answers.length);
    console.log('other player answers:', otherProgress.answers.length);
    console.log('game status:', game.status);

    if (progress.answers.length === 5 && otherProgress.answers.length === 5) {
      game.status = GameStatus.FINISHED;
      game.finishGameDate = new Date();

      // Bonus point logic
      const firstToFinish = this.getFasterPlayer(game);
      if (firstToFinish) {
          if (firstToFinish.score > 0 || firstToFinish.answers.some(a => a.answerStatus === AnswerStatus.CORRECT)) {
              // Wait, the rule says "хотя бы 1 вопрос отвечен правильно"
              // The player who finished first gets +1 IF they have >=1 correct answer.
              const hasCorrect = firstToFinish.answers.some(a => a.answerStatus === AnswerStatus.CORRECT);
              if (hasCorrect) {
                  firstToFinish.score += 1;
              }
          }
      }
    }

    await this.gameRepository.save(game);

    return {
      questionId: answer.questionId,
      answerStatus: answer.answerStatus,
      addedAt: answer.addedAt.toISOString(),
    };
  }

  private getFasterPlayer(game: QuizGame) {
      const p1Answers = game.firstPlayerProgress.answers;
      const p2Answers = game.secondPlayerProgress!.answers;

      if (p1Answers.length !== 5 || p2Answers.length !== 5) return null;

      const p1LastAnswerTime = Math.max(...p1Answers.map(a => a.addedAt.getTime()));
      const p2LastAnswerTime = Math.max(...p2Answers.map(a => a.addedAt.getTime()));

      if (p1LastAnswerTime < p2LastAnswerTime) {
          return game.firstPlayerProgress;
      } else if (p2LastAnswerTime < p1LastAnswerTime) {
          return game.secondPlayerProgress;
      }
      return null; // Both finished at the exact same time (rare)
  }
}
