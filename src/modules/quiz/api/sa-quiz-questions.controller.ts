import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { BasicAuthGuard } from '../../user-accounts/api/guards/basic-auth.guard';
import { QuestionInputModel, PublishInputModel } from './dto/quiz-questions.dto';
import { QuizQuestionsQueryParams } from './dto/quiz-questions-query.dto';
import { CreateQuestionCommand } from '../application/usecases/questions/create-question.handler';
import { UpdateQuestionCommand } from '../application/usecases/questions/update-question.handler';
import { DeleteQuestionCommand } from '../application/usecases/questions/delete-question.handler';
import { PublishQuestionCommand } from '../application/usecases/questions/publish-question.handler';
import { GetQuestionsQuery } from '../application/usecases/questions/get-questions.handler';

@ApiTags('SA Quiz Questions')
@UseGuards(BasicAuthGuard)
@Controller('sa/quiz/questions')
export class SAQuizQuestionsController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Returns all questions with pagination and filtering' })
  async getQuestions(@Query() queryParams: QuizQuestionsQueryParams) {
    return this.queryBus.execute(new GetQuestionsQuery(queryParams));
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create question' })
  async createQuestion(@Body() dto: QuestionInputModel) {
    return this.commandBus.execute(new CreateQuestionCommand(dto));
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete question' })
  async deleteQuestion(@Param('id') id: string) {
    return this.commandBus.execute(new DeleteQuestionCommand(id));
  }

  @Put(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Update question' })
  async updateQuestion(
    @Param('id') id: string,
    @Body() dto: QuestionInputModel,
  ) {
    return this.commandBus.execute(new UpdateQuestionCommand(id, dto));
  }

  @Put(':id/publish')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Publish/unpublish question' })
  async publishQuestion(
    @Param('id') id: string,
    @Body() dto: PublishInputModel,
  ) {
    return this.commandBus.execute(new PublishQuestionCommand(id, dto));
  }
}
