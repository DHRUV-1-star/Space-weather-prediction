import { SpaceWeatherTelemetry, SpaceWeatherForecast } from "@/types/space-weather";
import { SatelliteProfile } from "@/types/satellite";
import { MissionRiskAssessment, WhatIfSimulationRequest, WhatIfSimulationResponse, SatelliteComparisonResponse } from "@/types/risk";
import { HistoricalEvent, AlertItem } from "@/types/events";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";

async function fetchJSON<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(options?.headers || {})
      },
      cache: "no-store"
    });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }
    return await res.json();
  } catch (err: any) {
    console.warn(`[API] Network error requesting ${endpoint}: ${err.message}.`);
    throw err;
  }
}

export const orbitalApi = {
  // Space Weather
  async getCurrentSpaceWeather(scenario?: string): Promise<SpaceWeatherTelemetry> {
    const query = scenario ? `?scenario=${encodeURIComponent(scenario)}` : "";
    return fetchJSON<SpaceWeatherTelemetry>(`/space-weather/current${query}`);
  },

  async setScenario(scenarioKey: string): Promise<SpaceWeatherTelemetry> {
    return fetchJSON<SpaceWeatherTelemetry>(`/space-weather/scenario`, {
      method: "POST",
      body: JSON.stringify({ scenario_key: scenarioKey })
    });
  },

  async getLiveNOAA(): Promise<SpaceWeatherTelemetry> {
    return fetchJSON<SpaceWeatherTelemetry>(`/space-weather/live`);
  },

  async getForecast(scenario?: string): Promise<SpaceWeatherForecast> {
    const query = scenario ? `?scenario=${encodeURIComponent(scenario)}` : "";
    return fetchJSON<SpaceWeatherForecast>(`/space-weather/forecast${query}`);
  },

  async getAlerts(): Promise<AlertItem[]> {
    return fetchJSON<AlertItem[]>(`/alerts`);
  },

  // Satellites
  async getSatellites(): Promise<SatelliteProfile[]> {
    return fetchJSON<SatelliteProfile[]>(`/satellites`);
  },

  async getSatellite(id: string): Promise<SatelliteProfile> {
    return fetchJSON<SatelliteProfile>(`/satellites/${encodeURIComponent(id)}`);
  },

  async saveSatellite(profile: SatelliteProfile): Promise<SatelliteProfile> {
    return fetchJSON<SatelliteProfile>(`/satellites`, {
      method: "POST",
      body: JSON.stringify(profile)
    });
  },

  async selectSatellite(id: string): Promise<SatelliteProfile> {
    return fetchJSON<SatelliteProfile>(`/satellites/${encodeURIComponent(id)}/select`, {
      method: "POST"
    });
  },

  // Risk Assessment
  async calculateRisk(params: {
    satelliteId?: string;
    scenario?: string;
    customProfile?: SatelliteProfile;
  }): Promise<MissionRiskAssessment> {
    const queryParts = [];
    if (params.satelliteId) queryParts.push(`satellite_id=${encodeURIComponent(params.satelliteId)}`);
    if (params.scenario) queryParts.push(`scenario=${encodeURIComponent(params.scenario)}`);
    const query = queryParts.length ? `?${queryParts.join("&")}` : "";

    return fetchJSON<MissionRiskAssessment>(`/risk/calculate${query}`, {
      method: "POST",
      body: params.customProfile ? JSON.stringify(params.customProfile) : undefined
    });
  },

  // What-If Simulator
  async runSimulation(req: WhatIfSimulationRequest): Promise<WhatIfSimulationResponse> {
    return fetchJSON<WhatIfSimulationResponse>(`/simulation`, {
      method: "POST",
      body: JSON.stringify(req)
    });
  },

  // Compare Satellites
  async compareSatellites(ids: string[]): Promise<SatelliteComparisonResponse> {
    return fetchJSON<SatelliteComparisonResponse>(`/compare`, {
      method: "POST",
      body: JSON.stringify({ satellite_ids: ids })
    });
  },

  // Historical Events
  async getHistoricalEvents(): Promise<HistoricalEvent[]> {
    return fetchJSON<HistoricalEvent[]>(`/events`);
  },

  async getHistoricalEvent(id: string): Promise<HistoricalEvent> {
    return fetchJSON<HistoricalEvent>(`/events/${encodeURIComponent(id)}`);
  }
};
