import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { QuizQuestionsQueryRepository } from '../../../infrastructure/quiz-questions.query-repository';

export class GetQuestionsQuery {
  constructor(
    public readonly query: {
      bodySearchTerm?: string;
      publishedStatus?: string;
      sortBy?: string;
      sortDirection?: string;
      pageNumber?: number;
      pageSize?: number;
    },
  ) {}
}

@QueryHandler(GetQuestionsQuery)
export class GetQuestionsHandler implements IQueryHandler<GetQuestionsQuery> {
  constructor(private readonly queryRepository: QuizQuestionsQueryRepository) {}

  async execute(query: GetQuestionsQuery) {
    return this.queryRepository.getQuestions(query.query);
  }
}
