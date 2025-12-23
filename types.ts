
export interface Vehicle {
  id: string;
  name: string;
  active: boolean;
  code4_hash: string;
}

export interface StopMaster {
  id: string;
  name: string;
  lat: number;
  lon: number;
  type: 'BASE' | 'STOP';
  radius_m: number;
}

export interface DetectedStop {
  id: string;
  vehicle_id: string;
  stop_master_id: string;
  start_at: string;
  end_at: string;
  duration_sec: number;
  center_lat: number;
  center_lon: number;
  // Join fields
  stop_name?: string;
  vehicle_name?: string;
}

export interface ForecastItem {
  time: string;
  temp: number;
  rainProb: number;
  forecast: '晴れ' | '曇り' | '雨';
}

export interface WeatherData {
  temp: number;
  rainProb: number;
  forecast: string;
  locationName?: string;
  upcoming?: ForecastItem[];
}

export type ViewMode = 'driver' | 'admin';
