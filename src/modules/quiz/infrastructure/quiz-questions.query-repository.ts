import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { QuizQuestion } from '../domain/quiz-question.entity';
import { QuestionViewModel } from '../api/dto/quiz-questions.dto';

@Injectable()
export class QuizQuestionsQueryRepository {
  constructor(
    @InjectRepository(QuizQuestion)
    private readonly repo: Repository<QuizQuestion>,
  ) {}

  async getQuestions(query: {
    bodySearchTerm?: string;
    publishedStatus?: string;
    sortBy?: string;
    sortDirection?: string;
    pageNumber?: number;
    pageSize?: number;
  }) {
    const sortBy = query.sortBy || 'createdAt';
    const sortDirection = (query.sortDirection || 'DESC').toUpperCase() as
      | 'ASC'
      | 'DESC';
    const pageNumber = query.pageNumber ? +query.pageNumber : 1;
    const pageSize = query.pageSize ? +query.pageSize : 10;

    const queryBuilder = this.repo.createQueryBuilder('q');

    if (query.bodySearchTerm) {
      queryBuilder.andWhere('q.body ILIKE :term', {
        term: `%${query.bodySearchTerm}%`,
      });
    }

    if (query.publishedStatus === 'published') {
      queryBuilder.andWhere('q.published = true');
    } else if (query.publishedStatus === 'notPublished') {
      queryBuilder.andWhere('q.published = false');
    }

    queryBuilder.orderBy(`q.${sortBy}`, sortDirection);

    const [items, totalCount] = await queryBuilder
      .skip((pageNumber - 1) * pageSize)
      .take(pageSize)
      .getManyAndCount();

    return {
      pagesCount: Math.ceil(totalCount / pageSize),
      page: pageNumber,
      pageSize: pageSize,
      totalCount: totalCount,
      items: items.map(this.mapToView),
    };
  }

  mapToView(question: QuizQuestion): QuestionViewModel {
    return {
      id: question.id,
      body: question.body,
      correctAnswers: question.correctAnswers,
      published: question.published,
      createdAt: question.createdAt.toISOString(),
      updatedAt: question.updatedAt ? question.updatedAt.toISOString() : null,
    };
  }
}
