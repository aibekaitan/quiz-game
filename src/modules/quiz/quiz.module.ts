import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CqrsModule } from '@nestjs/cqrs';
import { QuizQuestion } from './domain/quiz-question.entity';
import { QuizGame } from './domain/quiz-game.entity';
import { QuizPlayerProgress, QuizAnswer } from './domain/quiz-player-progress.entity';
import { SAQuizQuestionsController } from './api/sa-quiz-questions.controller';
import { PublicQuizGameController } from './api/public-quiz-game.controller';
import { PublicQuizUsersController } from './api/public-quiz-users.controller';
import { QuizQuestionsRepository } from './infrastructure/quiz-questions.repository';
import { QuizQuestionsQueryRepository } from './infrastructure/quiz-questions.query-repository';
import { QuizGameRepository } from './infrastructure/quiz-game.repository';
import { QuizGameQueryRepository } from './infrastructure/quiz-game.query-repository';
import { QuizGameService } from './application/quiz-game.service';
import { CreateQuestionHandler } from './application/usecases/questions/create-question.handler';
import { UpdateQuestionHandler } from './application/usecases/questions/update-question.handler';
import { DeleteQuestionHandler } from './application/usecases/questions/delete-question.handler';
import { PublishQuestionHandler } from './application/usecases/questions/publish-question.handler';
import { GetQuestionsHandler } from './application/usecases/questions/get-questions.handler';
import { JoinOrCreateGameHandler } from './application/usecases/game/join-or-create-game.handler';
import { GetCurrentGameHandler } from './application/usecases/game/get-current-game.handler';
import { GetGameByIdHandler } from './application/usecases/game/get-game-by-id.handler';
import { SubmitAnswerHandler } from './application/usecases/game/submit-answer.handler';
import { GetMyGamesHandler } from './application/usecases/game/get-my-games.handler';
import { GetMyStatisticHandler } from './application/usecases/game/get-my-statistic.handler';
import { GetTopUsersHandler } from './application/usecases/game/get-top-users.handler';
import { UserAccountsModule } from '../user-accounts/user-accounts.module';
import { PassportModule } from '@nestjs/passport';

const handlers = [
  CreateQuestionHandler,
  UpdateQuestionHandler,
  DeleteQuestionHandler,
  PublishQuestionHandler,
  GetQuestionsHandler,
  JoinOrCreateGameHandler,
  GetCurrentGameHandler,
  GetGameByIdHandler,
  SubmitAnswerHandler,
  GetMyGamesHandler,
  GetMyStatisticHandler,
  GetTopUsersHandler,
];

const repositories = [
  QuizQuestionsRepository,
  QuizQuestionsQueryRepository,
  QuizGameRepository,
  QuizGameQueryRepository,
];

const services = [QuizGameService];

@Module({
  imports: [
    TypeOrmModule.forFeature([
      QuizQuestion,
      QuizGame,
      QuizPlayerProgress,
      QuizAnswer,
    ]),
    CqrsModule,
    UserAccountsModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
  ],
  controllers: [
    SAQuizQuestionsController,
    PublicQuizGameController,
    PublicQuizUsersController,
  ],
  providers: [...repositories, ...handlers, ...services],
  exports: [TypeOrmModule],
})
export class QuizModule {}
