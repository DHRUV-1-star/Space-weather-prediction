from typing import Dict, List, Optional
from app.schemas.satellite import SatelliteProfile, SatellitePreset

PREDEFINED_SATELLITES: Dict[str, SatelliteProfile] = {
    "SAT-EO-01": SatelliteProfile(
        id="SAT-EO-01",
        name="SAT-EO-01 (Cartographic Earth Observation)",
        mission_type="Earth Observation",
        orbit_type="LEO",
        altitude_km=550.0,
        inclination_deg=53.0,
        eccentricity=0.001,
        orbital_period_minutes=95.6,
        mass_kg=1200.0,
        cross_sectional_area_m2=4.5,
        drag_coefficient_cd=2.2,
        ballistic_coefficient=121.2,
        shielding_thickness_mm_al=2.5,
        radiation_hardening_level="Rad-Tolerant",
        solar_panel_sensitivity=7,
        communication_dependency=8,
        navigation_dependency=8,
        dielectric_coating_quality="Standard",
        notes="Demonstration Earth Observation satellite in Low Earth Orbit (550 km). Highly vulnerable to thermospheric drag surges.",
        is_preset=True
    ),
    "SAT-COM-01": SatelliteProfile(
        id="SAT-COM-01",
        name="SAT-COM-01 (High-Throughput GEO Comms)",
        mission_type="Communication",
        orbit_type="GEO",
        altitude_km=35786.0,
        inclination_deg=0.05,
        eccentricity=0.0001,
        orbital_period_minutes=1436.0,
        mass_kg=3800.0,
        cross_sectional_area_m2=32.0,
        drag_coefficient_cd=2.2,
        ballistic_coefficient=53.9,
        shielding_thickness_mm_al=4.5,
        radiation_hardening_level="Rad-Hard (Mil/Space)",
        solar_panel_sensitivity=5,
        communication_dependency=10,
        navigation_dependency=3,
        dielectric_coating_quality="Conductive ITO",
        notes="Demonstration Geostationary Communication satellite. High exposure to relativistic electron charging and substorm injections.",
        is_preset=True
    ),
    "SAT-NAV-01": SatelliteProfile(
        id="SAT-NAV-01",
        name="SAT-NAV-01 (Global Positioning & Timing)",
        mission_type="Navigation",
        orbit_type="MEO",
        altitude_km=20200.0,
        inclination_deg=55.0,
        eccentricity=0.002,
        orbital_period_minutes=718.0,
        mass_kg=1850.0,
        cross_sectional_area_m2=9.0,
        drag_coefficient_cd=2.2,
        ballistic_coefficient=93.4,
        shielding_thickness_mm_al=5.0,
        radiation_hardening_level="Rad-Hard (Mil/Space)",
        solar_panel_sensitivity=6,
        communication_dependency=6,
        navigation_dependency=10,
        dielectric_coating_quality="Advanced Conductive",
        notes="Demonstration Medium Earth Orbit navigation satellite. Traverses outer radiation belt; critical clock and signal integrity.",
        is_preset=True
    ),
    "SAT-SCI-01": SatelliteProfile(
        id="SAT-SCI-01",
        name="SAT-SCI-01 (Polar Sun-Synchronous Explorer)",
        mission_type="Scientific",
        orbit_type="LEO",
        altitude_km=680.0,
        inclination_deg=98.2,
        eccentricity=0.001,
        orbital_period_minutes=98.3,
        mass_kg=620.0,
        cross_sectional_area_m2=2.4,
        drag_coefficient_cd=2.2,
        ballistic_coefficient=117.4,
        shielding_thickness_mm_al=1.8,
        radiation_hardening_level="Commercial (COTS)",
        solar_panel_sensitivity=8,
        communication_dependency=7,
        navigation_dependency=6,
        dielectric_coating_quality="Standard",
        notes="Sun-synchronous scientific polar satellite utilizing COTS components. High exposure to polar horn solar protons.",
        is_preset=True
    ),
    "ISS-LIKE": SatelliteProfile(
        id="ISS-LIKE",
        name="HABITAT-01 (Heavy Orbital Station / ISS-Class)",
        mission_type="Scientific",
        orbit_type="LEO",
        altitude_km=415.0,
        inclination_deg=51.6,
        eccentricity=0.0005,
        orbital_period_minutes=92.8,
        mass_kg=420000.0,
        cross_sectional_area_m2=1200.0,
        drag_coefficient_cd=2.2,
        ballistic_coefficient=159.0,
        shielding_thickness_mm_al=8.0,
        radiation_hardening_level="Rad-Hard (Mil/Space)",
        solar_panel_sensitivity=6,
        communication_dependency=9,
        navigation_dependency=8,
        dielectric_coating_quality="Advanced Conductive",
        notes="Heavy orbital outpost in lower LEO (415 km). Massive solar arrays produce very large total drag force during storms.",
        is_preset=True
    )
}

class SatelliteService:
    def __init__(self):
        self.satellites: Dict[str, SatelliteProfile] = dict(PREDEFINED_SATELLITES)
        self.selected_satellite_id: str = "SAT-EO-01"

    def list_satellites(self) -> List[SatelliteProfile]:
        return list(self.satellites.values())

    def get_satellite(self, satellite_id: str) -> Optional[SatelliteProfile]:
        return self.satellites.get(satellite_id)

    def save_satellite(self, profile: SatelliteProfile) -> SatelliteProfile:
        # Calculate ballistic coeff and orbital period if needed
        from app.physics.drag_model import get_orbital_period_minutes
        profile.ballistic_coefficient = round(profile.mass_kg / max(0.01, profile.drag_coefficient_cd * profile.cross_sectional_area_m2), 1)
        profile.orbital_period_minutes = round(get_orbital_period_minutes(profile.altitude_km), 1)
        self.satellites[profile.id] = profile
        return profile

    def select_active_satellite(self, satellite_id: str) -> Optional[SatelliteProfile]:
        if satellite_id in self.satellites:
            self.selected_satellite_id = satellite_id
            return self.satellites[satellite_id]
        return None

satellite_service = SatelliteService()
