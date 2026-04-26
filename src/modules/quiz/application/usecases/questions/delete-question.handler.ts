import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { QuizQuestionsRepository } from '../../../infrastructure/quiz-questions.repository';
import { NotFoundException } from '@nestjs/common';

export class DeleteQuestionCommand {
  constructor(public readonly id: string) {}
}

@CommandHandler(DeleteQuestionCommand)
export class DeleteQuestionHandler implements ICommandHandler<DeleteQuestionCommand> {
  constructor(private readonly repository: QuizQuestionsRepository) {}

  async execute(command: DeleteQuestionCommand): Promise<boolean> {
    const deleted = await this.repository.delete(command.id);
    if (!deleted) {
      throw new NotFoundException('Question not found');
    }
    return true;
  }
}
