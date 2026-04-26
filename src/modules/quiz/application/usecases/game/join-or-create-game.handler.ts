import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { QuizGameRepository } from '../../../infrastructure/quiz-game.repository';
import { QuizQuestionsRepository } from '../../../infrastructure/quiz-questions.repository';
import { QuizGameQueryRepository } from '../../../infrastructure/quiz-game.query-repository';
import { ForbiddenException } from '@nestjs/common';
import { QuizPlayerProgress } from '../../../domain/quiz-player-progress.entity';
import { QuizGame, GameStatus } from '../../../domain/quiz-game.entity';

export class JoinOrCreateGameCommand {
  constructor(public readonly userId: string) {}
}

@CommandHandler(JoinOrCreateGameCommand)
export class JoinOrCreateGameHandler implements ICommandHandler<JoinOrCreateGameCommand> {
  constructor(
    private readonly gameRepository: QuizGameRepository,
    private readonly questionsRepository: QuizQuestionsRepository,
    private readonly queryRepository: QuizGameQueryRepository,
  ) {}

  async execute(command: JoinOrCreateGameCommand) {
    const { userId } = command;

    // 1. Check if user already has an active or pending game
    const activeGame = await this.gameRepository.findActiveGameByUserId(userId);
    if (activeGame) {
      throw new ForbiddenException('User already has an active or pending game');
    }

    // 2. Search for a game with PendingSecondPlayer
    const pendingGame = await this.gameRepository.findPendingGame();

    if (pendingGame) {
      // 3. Join the game
      const secondPlayerProgress = QuizPlayerProgress.create(userId);
      pendingGame.secondPlayerProgress = secondPlayerProgress;
      pendingGame.status = GameStatus.ACTIVE;
      pendingGame.startGameDate = new Date();
      
      // Select 5 random published questions
      const randomQuestions = await this.questionsRepository.getRandomPublishedQuestions(5);
      pendingGame.questions = randomQuestions;

      const savedGame = await this.gameRepository.save(pendingGame);
      
      // Need to reload to get full relations for mapping if necessary, 
      // but findActiveGameByUserId or findById should be used if queryRepository needs more.
      // Actually savedGame has most info, but we need users for login mapping.
      const fullGame = await this.gameRepository.findById(savedGame.id);
      return this.queryRepository.mapGameToView(fullGame!);
    } else {
      // 4. Create new game
      const firstPlayerProgress = QuizPlayerProgress.create(userId);
      const newGame = QuizGame.create(firstPlayerProgress);
      
      const savedGame = await this.gameRepository.save(newGame);
      const fullGame = await this.gameRepository.findById(savedGame.id);
      return this.queryRepository.mapGameToView(fullGame!);
    }
  }
}
