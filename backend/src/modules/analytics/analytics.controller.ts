import { Controller, Get, Param, Query } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';

@Controller('api/v1/pos')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('analytics/summary')
  async getSummary() {
    return this.analyticsService.getSummaryStats();
  }

  @Get('batches')
  async getBatches(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.analyticsService.getBatches(
      limit ? parseInt(limit, 10) : 50,
      page ? parseInt(page, 10) : 1,
    );
  }

  @Get('batches/:id')
  async getBatchById(@Param('id') id: string) {
    return this.analyticsService.getBatchById(id);
  }
}
