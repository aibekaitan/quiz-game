import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../user-accounts/api/guards/jwt-auth.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { GetMyStatisticQuery } from '../application/usecases/game/get-my-statistic.handler';
import { TopUsersQueryParams } from './dto/top-users-query.dto';
import { GetTopUsersQuery } from '../application/usecases/game/get-top-users.handler';

@ApiTags('Public Quiz Users')
@Controller('pair-game-quiz/users')
export class PublicQuizUsersController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get('top')
  @ApiOperation({ summary: 'Get users top' })
  async getTopUsers(@Query() queryParams: TopUsersQueryParams) {
    return this.queryBus.execute(new GetTopUsersQuery(queryParams));
  }

  @UseGuards(JwtAuthGuard)
  @Get('my-statistic')
  @ApiOperation({ summary: 'Get current user statistic' })
  async getMyStatistic(@CurrentUser() user: any) {
    return this.queryBus.execute(new GetMyStatisticQuery(user.id));
  }
}
