import { BaseQueryParams } from '../../../../core/dto/base.query-params.input-dto';

export class MyGamesQueryParams extends BaseQueryParams {
  constructor() {
    super();
    this.sortBy = 'pairCreatedDate';
  }
}
