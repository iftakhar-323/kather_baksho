/**
 * IoT Smart Plant Botanical Telemetry Type Definitions (MongoDB Polyglot Data)
 */

export interface PlantTelemetry {
  id?: string;
  plant_id: number;
  species: string;
  moisture_percent: number;
  temperature_c: number;
  humidity_percent: number;
  sunlight_lux: number;
  ph_level: number;
  botanical_status: "Optimal Health" | "Needs Water" | "High Heat Caution" | "Low Light" | "Normal";
  alert?: string;
  timestamp: string;
}

export interface MonitoredPlant {
  plant_id: number;
  species: string;
  latest: PlantTelemetry;
}

export interface IoTTelemetryResponse {
  plant_id: number;
  history: PlantTelemetry[];
  count: number;
}

