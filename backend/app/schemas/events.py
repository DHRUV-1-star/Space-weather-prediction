from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

class HistoricalEventTimelineStep(BaseModel):
    time_offset: str
    phase_title: str
    description: str
    kp: float
    flux: float
    satellite_impact_summary: str

class HistoricalEvent(BaseModel):
    id: str
    name: str
    date_str: str
    category: str
    max_kp: float
    max_flare_class: str
    dst_peak_nt: float
    solar_wind_peak_kms: float
    proton_flux_peak_pfu: float
    summary: str
    real_world_consequences: List[str]
    timeline_steps: List[HistoricalEventTimelineStep]
    model_prediction_accuracy_pct: float
    prediction_vs_observed_notes: str

class AlertItem(BaseModel):
    id: str
    timestamp: datetime
    level: str  # INFO, WATCH, WARNING, CRITICAL
    category: str  # GEOMAGNETIC, FLARE, RADIATION, DRAG, CHARGING
    title: str
    message: str
    affected_systems: List[str]
    dismissed: bool = False
