import { Controller, Get, Query } from '@nestjs/common';
import { HobbyLobbyService } from './hobby-lobby.service';

@Controller('api/v1/pos/hobby-lobby')
export class HobbyLobbyController {
  constructor(private readonly hobbyLobbyService: HobbyLobbyService) {}

  @Get()
  async getHobbyLobbyData(
    @Query('search') search?: string,
    @Query('department') department?: string,
    @Query('vendorNumber') vendorNumber?: string,
    @Query('reportingYear') reportingYear?: string,
    @Query('reportingMonth') reportingMonth?: string,
    @Query('batchId') batchId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.hobbyLobbyService.getData({
      search,
      department,
      vendorNumber,
      reportingYear: reportingYear ? parseInt(reportingYear, 10) : undefined,
      reportingMonth: reportingMonth ? parseInt(reportingMonth, 10) : undefined,
      batchId,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 50,
    });
  }
}
