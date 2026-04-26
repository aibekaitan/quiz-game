import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { User } from '../../user-accounts/domain/user.entity';

export enum AnswerStatus {
  CORRECT = 'Correct',
  INCORRECT = 'Incorrect',
}

@Entity('quiz_player_progress')
export class QuizPlayerProgress {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'integer', default: 0 })
  score: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'uuid' })
  userId: string;

  @OneToMany(() => QuizAnswer, (answer) => answer.progress, { cascade: true })
  answers: QuizAnswer[];

  static create(userId: string): QuizPlayerProgress {
    const progress = new QuizPlayerProgress();
    progress.userId = userId;
    progress.score = 0;
    progress.answers = [];
    return progress;
  }
}

@Entity('quiz_answers')
export class QuizAnswer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: false })
  questionId: string;

  @Column({ type: 'enum', enum: AnswerStatus, nullable: false })
  answerStatus: AnswerStatus;

  @Column({ type: 'timestamp', nullable: false })
  addedAt: Date;

  @ManyToOne(() => QuizPlayerProgress, (progress) => progress.answers)
  progress: QuizPlayerProgress;
}
