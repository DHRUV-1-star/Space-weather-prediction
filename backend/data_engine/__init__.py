"""Orbital Shield data engine.

Modules that simulate space weather telemetry and generate synthetic
satellite-orbit training data for downstream ML models.
"""

from .space_weather_simulator import SpaceWeatherSimulator
from .dataset_builder import build_training_dataset

__all__ = ["SpaceWeatherSimulator", "build_training_dataset"]