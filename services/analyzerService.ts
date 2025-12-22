
import { GPSPoint, StopMaster, OperationEvent, VehicleId } from '../types';
import { calculateDistance } from '../utils/geoUtils';

const STAY_DISTANCE_THRESHOLD = 10; // 10m以内
const STAY_TIME_THRESHOLD_MS = 3 * 60 * 1000; // 3分以上
const MASTER_PROXIMITY_THRESHOLD = 30; // 30m以内

export class RealtimeTracker {
  private lastPoints: GPSPoint[] = [];
  private currentStop: StopMaster | null = null;
  private isStaying = false;
  private stayStartTime: number | null = null;

  constructor(
    private vehicleId: VehicleId,
    private masters: StopMaster[],
    private onEvent: (event: Omit<OperationEvent, 'id'>) => void
  ) {}

  processPoint(point: GPSPoint) {
    this.lastPoints.push(point);
    // 直近5分程度のデータのみ保持
    const fiveMinsAgo = point.timestamp.getTime() - 5 * 60 * 1000;
    this.lastPoints = this.lastPoints.filter(p => p.timestamp.getTime() > fiveMinsAgo);

    if (this.lastPoints.length < 2) return;

    const prevPoint = this.lastPoints[this.lastPoints.length - 2];
    const dist = calculateDistance(prevPoint.latitude, prevPoint.longitude, point.latitude, point.longitude);

    // 1. 停留判定 (10m以内の移動)
    if (dist <= STAY_DISTANCE_THRESHOLD) {
      if (!this.stayStartTime) {
        this.stayStartTime = point.timestamp.getTime();
      }
    } else {
      this.stayStartTime = null;
    }

    // 2. 停留所マスタとの突合
    let nearbyMaster: StopMaster | null = null;
    for (const m of this.masters) {
      const d = calculateDistance(point.latitude, point.longitude, m.latitude, m.longitude);
      if (d <= MASTER_PROXIMITY_THRESHOLD) {
        nearbyMaster = m;
        break;
      }
    }

    // 確定ロジック:
    // 到着判定: 未滞在 かつ (3分以上10m以内) かつ (マスタ近傍30m)
    if (!this.isStaying && nearbyMaster && this.stayStartTime && (point.timestamp.getTime() - this.stayStartTime >= STAY_TIME_THRESHOLD_MS)) {
      this.isStaying = true;
      this.currentStop = nearbyMaster;
      this.onEvent({
        vehicleId: this.vehicleId,
        type: 'ARRIVAL',
        locationName: nearbyMaster.name,
        timestamp: new Date(this.stayStartTime),
        latitude: point.latitude,
        longitude: point.longitude
      });
    }

    // 出発判定: 滞在中 かつ (マスタから30m以上離れる または 動き出した)
    if (this.isStaying && this.currentStop) {
      const distFromStop = calculateDistance(point.latitude, point.longitude, this.currentStop.latitude, this.currentStop.longitude);
      if (distFromStop > MASTER_PROXIMITY_THRESHOLD) {
        this.onEvent({
          vehicleId: this.vehicleId,
          type: 'DEPARTURE',
          locationName: this.currentStop.name,
          timestamp: point.timestamp,
          latitude: point.latitude,
          longitude: point.longitude
        });
        this.isStaying = false;
        this.currentStop = null;
      }
    }
  }
}
