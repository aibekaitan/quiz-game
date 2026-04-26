import { AnswerStatus } from '../../domain/quiz-player-progress.entity';
import { GameStatus } from '../../domain/quiz-game.entity';

export class AnswerViewModel {
  questionId: string;
  answerStatus: AnswerStatus;
  addedAt: string;
}

export class PlayerProgressViewModel {
  answers: AnswerViewModel[];
  player: {
    id: string;
    login: string;
  };
  score: number;
}

export class QuestionGameViewModel {
  id: string;
  body: string;
}

export class GameViewModel {
  id: string;
  firstPlayerProgress: PlayerProgressViewModel;
  secondPlayerProgress: PlayerProgressViewModel | null;
  questions: QuestionGameViewModel[] | null;
  status: GameStatus;
  pairCreatedDate: string;
  startGameDate: string | null;
  finishGameDate: string | null;
}

export class AnswerInputModel {
  answer: string;
}
