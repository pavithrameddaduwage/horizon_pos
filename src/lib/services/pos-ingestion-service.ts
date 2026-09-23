// POS Ingestion Service Wrapper (Backward Compatibility Layer)
// Bridges legacy calls to the 4 isolated microservice components.

import {
  IngestionBatchRecord,
  RetailerCode,
  FiveBelowFamily,
} from '../types/pos';
import {
  posMicroserviceGateway,
  hobbyLobbyService,
  fiveBelowService,
  kohlsService,
  msiService,
} from './microservices';

class LegacyPOSDataStoreBridge {
  public processUpload(params: {
    fileContent: string;
    fileName: string;
    retailerOverride?: RetailerCode;
    familyOverride?: FiveBelowFamily;
    departmentOverride?: string;
    uploadedBy?: string;
  }) {
    // Synchronous / immediate execution via gateway
    return posMicroserviceGateway.routeUpload(params);
  }

  public async getBatches(retailer?: RetailerCode): Promise<IngestionBatchRecord[]> {
    return await posMicroserviceGateway.getAllBatches(retailer);
  }

  public async getHobbyLobbyData(filters?: any) {
    return await hobbyLobbyService.getData(filters);
  }

  public async getFiveBelowData(filters?: any) {
    return await fiveBelowService.getData(filters);
  }

  public async getKohlsData(filters?: any) {
    return await kohlsService.getData(filters);
  }

  public async getMsiData(filters?: any) {
    return await msiService.getData(filters);
  }

  public async getMisData(filters?: any) {
    return await msiService.getData(filters);
  }

  public async getKPIs() {
    return await posMicroserviceGateway.getAggregatedKPIs();
  }
}

export const posDataStore = new LegacyPOSDataStoreBridge();
