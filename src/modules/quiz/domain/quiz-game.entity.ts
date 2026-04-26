import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  OneToOne,
  JoinColumn,
  ManyToMany,
  JoinTable,
  CreateDateColumn,
} from 'typeorm';
import { QuizPlayerProgress } from './quiz-player-progress.entity';
import { QuizQuestion } from './quiz-question.entity';

export enum GameStatus {
  PENDING_SECOND_PLAYER = 'PendingSecondPlayer',
  ACTIVE = 'Active',
  FINISHED = 'Finished',
}

@Entity('quiz_games')
export class QuizGame {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: GameStatus, default: GameStatus.PENDING_SECOND_PLAYER })
  status: GameStatus;

  @OneToOne(() => QuizPlayerProgress, { cascade: true })
  @JoinColumn()
  firstPlayerProgress: QuizPlayerProgress;

  @OneToOne(() => QuizPlayerProgress, { cascade: true, nullable: true })
  @JoinColumn()
  secondPlayerProgress: QuizPlayerProgress | null;

  @ManyToMany(() => QuizQuestion)
  @JoinTable({ name: 'quiz_game_questions' })
  questions: QuizQuestion[] | null;

  @CreateDateColumn({ type: 'timestamp' })
  pairCreatedDate: Date;

  @Column({ type: 'timestamp', nullable: true })
  startGameDate: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  finishGameDate: Date | null;

  static create(firstPlayerProgress: QuizPlayerProgress): QuizGame {
    const game = new QuizGame();
    game.status = GameStatus.PENDING_SECOND_PLAYER;
    game.firstPlayerProgress = firstPlayerProgress;
    game.secondPlayerProgress = null;
    game.questions = null;
    game.pairCreatedDate = new Date();
    game.startGameDate = null;
    game.finishGameDate = null;
    return game;
  }
}
