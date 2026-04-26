import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../user-accounts/api/guards/jwt-auth.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { AnswerInputModel } from './dto/quiz-game.dto';
import { JoinOrCreateGameCommand } from '../application/usecases/game/join-or-create-game.handler';
import { GetCurrentGameQuery } from '../application/usecases/game/get-current-game.handler';
import { GetGameByIdQuery } from '../application/usecases/game/get-game-by-id.handler';
import { SubmitAnswerCommand } from '../application/usecases/game/submit-answer.handler';

@ApiTags('Public Quiz Game')
@UseGuards(JwtAuthGuard)
@Controller('pair-game-quiz/pairs')
export class PublicQuizGameController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post('connection')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Returns current game in status PendingSecondPlayer or Active' })
  async connectToGame(@CurrentUser() user: any) {
    return this.commandBus.execute(new JoinOrCreateGameCommand(user.id));
  }

  @Get('my-current')
  @ApiOperation({ summary: 'Returns current game in status PendingSecondPlayer or Active' })
  async getCurrentGame(@CurrentUser() user: any) {
    return this.queryBus.execute(new GetCurrentGameQuery(user.id));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Returns game by id' })
  async getGameById(@Param('id') id: string, @CurrentUser() user: any) {
    return this.queryBus.execute(new GetGameByIdQuery(id, user.id));
  }

  @Post('my-current/answers')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send answer for next not answered question in active game' })
  async sendAnswer(@Body() dto: AnswerInputModel, @CurrentUser() user: any) {
    return this.commandBus.execute(new SubmitAnswerCommand(user.id, dto));
  }
}
