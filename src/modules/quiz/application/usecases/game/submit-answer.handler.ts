import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { QuizGameRepository } from '../../../infrastructure/quiz-game.repository';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { AnswerInputModel } from '../../../api/dto/quiz-game.dto';
import { GameStatus, QuizGame } from '../../../domain/quiz-game.entity';
import { QuizAnswer, AnswerStatus } from '../../../domain/quiz-player-progress.entity';
import { QuizGameService } from '../../quiz-game.service';

export class SubmitAnswerCommand {
  constructor(
    public readonly userId: string,
    public readonly dto: AnswerInputModel,
  ) {}
}

@CommandHandler(SubmitAnswerCommand)
export class SubmitAnswerHandler implements ICommandHandler<SubmitAnswerCommand> {
  constructor(
    private readonly gameRepository: QuizGameRepository,
    private readonly gameService: QuizGameService,
  ) {}

  async execute(command: SubmitAnswerCommand) {
    const { userId, dto } = command;

    // 1. Find active game for user
    let game = await this.gameRepository.findActiveGameByUserId(userId);
    if (!game || game.status !== GameStatus.ACTIVE) {
      throw new ForbiddenException('User is not in an active game');
    }

    // Check if game is already expired (10s rule)
    game = await this.gameService.checkAndFinishGame(game);
    if (game.status === GameStatus.FINISHED) {
        throw new ForbiddenException('Game is already finished');
    }

    const isFirstPlayer = game.firstPlayerProgress.userId === userId;
    const progress = isFirstPlayer ? game.firstPlayerProgress : game.secondPlayerProgress!;
    
    // 2. Check if user already answered all questions
    if (progress.answers.length >= 5) {
      throw new ForbiddenException('User already answered all questions');
    }

    // 3. Determine current question
    const sortedQuestions = [...game.questions!].sort((a, b) => a.id.localeCompare(b.id));
    const currentQuestionIndex = progress.answers.length;
    const question = sortedQuestions[currentQuestionIndex];

    // 4. Validate answer
    const isCorrect = question.correctAnswers.some(
      (ans) => ans && ans.toLowerCase() === (dto.answer || '').toLowerCase(),
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

    // Set first finisher date if not already set and this player just finished
    if (progress.answers.length === 5 && !game.firstFinisherDate) {
        game.firstFinisherDate = new Date();
    }

    await this.gameRepository.save(game);

    // 6. Check if both players finished or 10s rule applies
    await this.gameService.checkAndFinishGame(game);

    return {
      questionId: answer.questionId,
      answerStatus: answer.answerStatus,
      addedAt: answer.addedAt.toISOString(),
    };
  }
}
