
export interface GPSPoint {
  timestamp: Date;
  latitude: number;
  longitude: number;
}

export interface StopMaster {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  isBase: boolean; // 拠点かどうかのフラグ
  description?: string;
}

export type VehicleId = '1号車' | '2号車' | '3号車';

export type VehiclePins = Record<VehicleId, string>;

export interface OperationEvent {
  id: string;
  vehicleId: VehicleId;
  type: 'SHIFT_START' | 'SHIFT_END' | 'ARRIVAL' | 'DEPARTURE';
  locationName: string;
  timestamp: Date;
  latitude: number;
  longitude: number;
}

export interface DetectedStay {
  startTime: Date;
  endTime: Date;
  durationMinutes: number;
  latitude: number;
  longitude: number;
  matchedMasterName?: string;
}

export interface AnalysisResult {
  totalDistanceKm: number;
  totalPoints: number;
  stays: DetectedStay[];
  confirmedStops: DetectedStay[];
}

export const DEFAULT_MASTERS: StopMaster[] = [
  { id: '1', name: '中央配送センター', latitude: 35.6812, longitude: 139.7671, isBase: true, description: 'メインハブ' },
  { id: '2', name: '新宿北ステーション', latitude: 35.6938, longitude: 139.7034, isBase: false, description: '北口近傍店舗' },
  { id: '3', name: '渋谷南ステーション', latitude: 35.6580, longitude: 139.7016, isBase: false, description: '南口配送所' },
  { id: '4', name: '銀座サテライト', latitude: 35.6720, longitude: 139.7640, isBase: true, description: '銀座営業所' }
];

export enum AppView {
  DRIVER = 'DRIVER',
  ADMIN_LOGS = 'ADMIN_LOGS',
  MASTER_DATA = 'MASTER_DATA'
}
