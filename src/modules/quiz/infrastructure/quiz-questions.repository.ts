import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { QuizQuestion } from '../domain/quiz-question.entity';

@Injectable()
export class QuizQuestionsRepository {
  constructor(
    @InjectRepository(QuizQuestion)
    private readonly repo: Repository<QuizQuestion>,
  ) {}

  async save(question: QuizQuestion): Promise<QuizQuestion> {
    return this.repo.save(question);
  }

  async findById(id: string): Promise<QuizQuestion | null> {
    return this.repo.findOneBy({ id });
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.repo.delete(id);
    return result.affected === 1;
  }

  async getRandomPublishedQuestions(count: number): Promise<QuizQuestion[]> {
    return this.repo
      .createQueryBuilder('q')
      .where('q.published = true')
      .orderBy('RANDOM()')
      .limit(count)
      .getMany();
  }
}
