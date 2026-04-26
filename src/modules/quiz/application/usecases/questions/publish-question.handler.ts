import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { PublishInputModel } from '../../../api/dto/quiz-questions.dto';
import { QuizQuestionsRepository } from '../../../infrastructure/quiz-questions.repository';
import { BadRequestException, NotFoundException } from '@nestjs/common';

export class PublishQuestionCommand {
  constructor(
    public readonly id: string,
    public readonly dto: PublishInputModel,
  ) {}
}

@CommandHandler(PublishQuestionCommand)
export class PublishQuestionHandler implements ICommandHandler<PublishQuestionCommand> {
  constructor(private readonly repository: QuizQuestionsRepository) {}

  async execute(command: PublishQuestionCommand): Promise<boolean> {
    const question = await this.repository.findById(command.id);
    if (!question) {
      throw new NotFoundException('Question not found');
    }

    if (command.dto.published && (!question.correctAnswers || question.correctAnswers.length === 0)) {
        throw new BadRequestException({
            errorsMessages: [{ message: 'Question must have correct answers to be published', field: 'published' }]
        });
    }

    question.published = command.dto.published;
    question.updatedAt = new Date();
    
    await this.repository.save(question);
    return true;
  }
}
