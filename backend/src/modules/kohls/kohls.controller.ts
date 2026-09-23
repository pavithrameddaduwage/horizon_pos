import { Controller, Get, Query } from '@nestjs/common';
import { KohlsService } from './kohls.service';

@Controller('api/v1/pos/kohls')
export class KohlsController {
  constructor(private readonly kohlsService: KohlsService) {}

  @Get()
  async getKohlsData(
    @Query('search') search?: string,
    @Query('department') department?: string,
    @Query('storeNumber') storeNumber?: string,
    @Query('batchId') batchId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.kohlsService.getData({
      search,
      department,
      storeNumber,
      batchId,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 50,
    });
  }
}
