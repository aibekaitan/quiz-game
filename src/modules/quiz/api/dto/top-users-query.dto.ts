import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class TopUsersQueryParams {
  @IsOptional()
  sort: string | string[] = ['avgScores desc', 'sumScore desc'];

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pageNumber = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pageSize = 10;
}
