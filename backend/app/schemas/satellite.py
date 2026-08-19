from pydantic import BaseModel, Field
from typing import Optional, Literal

OrbitType = Literal["LEO", "MEO", "GEO", "HEO"]
MissionType = Literal["Earth Observation", "Communication", "Navigation", "Scientific", "Weather", "Defense/Surveillance", "Other"]

class SatelliteProfile(BaseModel):
    id: str = Field(..., description="Unique identifier (e.g. SAT-EO-01)")
    name: str = Field(..., description="Display name of the spacecraft")
    mission_type: MissionType = Field("Earth Observation")
    orbit_type: OrbitType = Field("LEO")
    
    # Orbital parameters
    altitude_km: float = Field(550.0, ge=150.0, le=45000.0, description="Perigee/Mean altitude in km")
    apogee_km: Optional[float] = Field(None, description="Apogee altitude for eccentric orbits")
    inclination_deg: float = Field(53.0, ge=0.0, le=180.0, description="Orbit inclination in degrees")
    eccentricity: float = Field(0.001, ge=0.0, le=0.95, description="Orbital eccentricity")
    orbital_period_minutes: float = Field(95.6, description="Calculated orbital period in minutes")
    
    # Physical parameters
    mass_kg: float = Field(1200.0, ge=1.0, le=1000000.0, description="Dry/Wet mass in kg")
    cross_sectional_area_m2: float = Field(4.5, ge=0.01, le=5000.0, description="Effective drag/radiation area in m^2")
    drag_coefficient_cd: float = Field(2.2, ge=1.5, le=3.5, description="Aerodynamic drag coefficient (typically 2.2)")
    ballistic_coefficient: float = Field(121.2, description="m / (Cd * A) in kg/m^2")
    
    # Subsystem sensitivities & shielding (1 to 10 scale or mm Al equivalent)
    shielding_thickness_mm_al: float = Field(2.5, ge=0.5, le=20.0, description="Equivalent aluminum shielding in mm")
    radiation_hardening_level: Literal["Commercial (COTS)", "Industrial", "Rad-Tolerant", "Rad-Hard (Mil/Space)"] = Field("Rad-Tolerant")
    solar_panel_sensitivity: int = Field(6, ge=1, le=10, description="Sensitivity of solar arrays to proton damage (1-10)")
    communication_dependency: int = Field(8, ge=1, le=10, description="Criticality of continuous telemetry & payload comms (1-10)")
    navigation_dependency: int = Field(7, ge=1, le=10, description="Criticality of GNSS position/timing integrity (1-10)")
    dielectric_coating_quality: Literal["Low", "Standard", "Conductive ITO", "Advanced Conductive"] = Field("Standard")
    
    notes: Optional[str] = "Demo satellite configuration — not an actual spacecraft."
    is_preset: bool = False

class SatellitePreset(BaseModel):
    key: str
    name: str
    profile: SatelliteProfile
