"""Orbital Shield - backend FastAPI entry point.

Wires together the risk-engine router, a health-check endpoint and the CORS
policy required by the Vite frontend (``http://localhost:5173``).

Run from the repository root:

    uvicorn backend.app.main:app --reload --port 8000
"""

from __future__ import annotations

from typing import Any

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from ..ml.inference import InferenceEngine
from ..routers.risk_engine import router as risk_router

ORIGINS: list[str] = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

app = FastAPI(
    title="Orbital Shield - Space Weather Risk Engine",
    description="Predictive satellite risk assessment (orbital decay and radiation anomalies).",
    version="0.2.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(risk_router)


@app.get("/api/health", tags=["system"])
def health_check() -> dict[str, Any]:
    """Liveness probe; reports model readiness without heavy loads."""
    try:
        engine = InferenceEngine()
        drag_ready = (engine.models_dir / "leo_drag_predictor.joblib").exists()
        anomaly_ready = (engine.models_dir / "anomaly_classifier.joblib").exists()
    except Exception:
        drag_ready = anomaly_ready = False
    return {
        "status": "ok",
        "service": "orbital-shield-backend",
        "version": app.version,
        "models": {"leo_drag_predictor": drag_ready, "anomaly_classifier": anomaly_ready},
    }

