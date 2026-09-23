import { Controller, Get, Query } from '@nestjs/common';
import { MsiService } from './msi.service';

@Controller('api/v1/pos/msi')
export class MsiController {
  constructor(private readonly msiService: MsiService) {}

  @Get()
  async getMsiData(
    @Query('search') search?: string,
    @Query('department') department?: string,
    @Query('storeId') storeId?: string,
    @Query('batchId') batchId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.msiService.getData({
      search,
      department,
      storeId,
      batchId,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 50,
    });
  }
}
