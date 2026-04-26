import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { QuestionInputModel } from '../../../api/dto/quiz-questions.dto';
import { QuizQuestion } from '../../../domain/quiz-question.entity';
import { QuizQuestionsRepository } from '../../../infrastructure/quiz-questions.repository';

export class CreateQuestionCommand {
  constructor(public readonly dto: QuestionInputModel) {}
}

@CommandHandler(CreateQuestionCommand)
export class CreateQuestionHandler implements ICommandHandler<CreateQuestionCommand> {
  constructor(private readonly repository: QuizQuestionsRepository) {}

  async execute(command: CreateQuestionCommand) {
    const question = QuizQuestion.create(command.dto);
    const saved = await this.repository.save(question);


    return {
      id: saved.id,
      body: saved.body,
      correctAnswers: saved.correctAnswers,
      published: saved.published,
      createdAt: saved.createdAt.toISOString(),
      updatedAt: saved.updatedAt ? saved.updatedAt.toISOString() : null,
    };
  }
}
