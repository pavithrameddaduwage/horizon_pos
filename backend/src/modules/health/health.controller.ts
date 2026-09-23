import { Controller, Get } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Controller()
export class HealthController {
  constructor(private readonly dataSource: DataSource) {}

  @Get('health')
  @Get('api/v1/health')
  getHealth() {
    return {
      status: 'ok',
      service: 'horizon-pos-backend',
      timestamp: new Date().toISOString(),
      databaseConnected: this.dataSource.isInitialized,
    };
  }

  @Get('db-check')
  async getDbCheck() {
    try {
      const result = await this.dataSource.query('SELECT NOW() as current_time, current_database() as database');
      return {
        status: 'healthy',
        database: result[0]?.database,
        currentTime: result[0]?.current_time,
      };
    } catch (err: any) {
      return {
        status: 'error',
        message: err.message,
      };
    }
  }
}
