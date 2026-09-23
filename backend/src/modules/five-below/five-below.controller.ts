import { Controller, Get, Query } from '@nestjs/common';
import { FiveBelowService } from './five-below.service';

@Controller('api/v1/pos/five-below')
export class FiveBelowController {
  constructor(private readonly fiveBelowService: FiveBelowService) {}

  @Get()
  async getFiveBelowData(
    @Query('search') search?: string,
    @Query('family') family?: string,
    @Query('department') department?: string,
    @Query('batchId') batchId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.fiveBelowService.getData({
      search,
      family,
      department,
      batchId,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 50,
    });
  }
}
