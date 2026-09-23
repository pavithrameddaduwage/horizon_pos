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

  public getBatches(retailer?: RetailerCode): IngestionBatchRecord[] {
    return posMicroserviceGateway.getAllBatches(retailer);
  }

  public getHobbyLobbyData(filters?: any) {
    return hobbyLobbyService.getData(filters);
  }

  public getFiveBelowData(filters?: any) {
    return fiveBelowService.getData(filters);
  }

  public getKohlsData(filters?: any) {
    return kohlsService.getData(filters);
  }

  public getMsiData(filters?: any) {
    return msiService.getData(filters);
  }

  public getMisData(filters?: any) {
    return msiService.getData(filters);
  }

  public getKPIs() {
    return posMicroserviceGateway.getAggregatedKPIs();
  }
}

export const posDataStore = new LegacyPOSDataStoreBridge();
