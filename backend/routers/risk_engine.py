"""Risk-engine API router.

Exposes ``POST /api/assess-risk`` which pushes a satellite telemetry snapshot
through the trained drag regressor and anomaly classifier and returns a full
risk assessment (decay forecast, radiation risk, lifecycle band and manoeuvre
guidance).
"""

from __future__ import annotations

from typing import Any

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from ..ml.inference import InferenceEngine, engine

router = APIRouter()


class RiskAssessmentRequest(BaseModel):
    """Input telemetry for a single satellite risk assessment."""

    satellite_name: str = Field(..., examples=["INSAT-3DR"])
    orbit_type: str = Field(..., examples=["GEO"])  # LEO | MEO | GEO
    altitude_km: float = Field(..., gt=0, examples=[35786.0])
    mass_kg: float = Field(..., gt=0, examples=[2000.0])
    area_m2: float = Field(..., gt=0, examples=[40.0])
    kp_index: float = Field(..., ge=0.0, le=9.0, examples=[6.0])
    solar_flux_f107: float = Field(..., gt=0.0, le=400.0, examples=[189.0])
    proton_flux: float = Field(..., ge=0.0, examples=[120.0])


@router.post("/api/assess-risk", tags=["risk"])
def assess_risk(request: RiskAssessmentRequest) -> dict[str, Any]:
    """Run ML inference for drag decay, radiation risk and recommend actions."""
    try:
        result = InferenceEngine().assess_risk(
            satellite_name=request.satellite_name,
            orbit_type=request.orbit_type,
            altitude_km=request.altitude_km,
            mass_kg=request.mass_kg,
            area_m2=request.area_m2,
            kp_index=request.kp_index,
            solar_flux_f107=request.solar_flux_f107,
            proton_flux=request.proton_flux,
        )
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc))
    return result

