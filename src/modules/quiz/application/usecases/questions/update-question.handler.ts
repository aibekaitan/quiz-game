import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { QuestionInputModel } from '../../../api/dto/quiz-questions.dto';
import { QuizQuestionsRepository } from '../../../infrastructure/quiz-questions.repository';
import { NotFoundException } from '@nestjs/common';

export class UpdateQuestionCommand {
  constructor(
    public readonly id: string,
    public readonly dto: QuestionInputModel,
  ) {}
}

@CommandHandler(UpdateQuestionCommand)
export class UpdateQuestionHandler implements ICommandHandler<UpdateQuestionCommand> {
  constructor(private readonly repository: QuizQuestionsRepository) {}

  async execute(command: UpdateQuestionCommand): Promise<boolean> {
    const question = await this.repository.findById(command.id);
    if (!question) {
      throw new NotFoundException('Question not found');
    }

    question.body = command.dto.body;
    question.correctAnswers = command.dto.correctAnswers;
    
    await this.repository.save(question);
    return true;
  }
}
