from typing import List
from app.schemas.risk import SubsystemRisk

def generate_operational_recommendations(
    drag: SubsystemRisk,
    radiation: SubsystemRisk,
    charging: SubsystemRisk,
    comms: SubsystemRisk,
    nav: SubsystemRisk,
    altitude_km: float,
    orbit_type: str,
    mission_type: str
) -> List[str]:
    """
    Generates actionable, mission-aware operational decision-support recommendations.
    All guidance is strictly advisory (using 'Consider...', 'Review...', 'Monitor...', 'Prepare...').
    """
    recommendations: List[str] = []
    
    # 1. Atmospheric Drag Mitigations (LEO focus)
    if drag.score >= 70:
        recommendations.append(
            "Increase orbit ephemeris propagation frequency and coordinate with SSA tracking networks to assess collision avoidance margins."
        )
        recommendations.append(
            "Review orbit maintenance fuel budget and prepare thruster re-boost scenarios to compensate for accelerated semi-major axis decay."
        )
        if drag.score >= 85:
            recommendations.append(
                "Consider commanding solar array feathering (drag-reduction attitude mode) during non-critical payload pass windows."
            )
    elif drag.score >= 45 and altitude_km < 700:
        recommendations.append(
            "Monitor Daily Mean Motion trend from Doppler telemetry to verify neutral thermospheric density expansion rates."
        )
        
    # 2. Radiation & SEU Mitigations
    if radiation.score >= 65:
        recommendations.append(
            "Increase telemetry sampling rate on volatile memory error-detection-and-correction (EDAC) counters to detect single-event upsets."
        )
        recommendations.append(
            "Consider placing sensitive scientific sensors and high-voltage focal plane arrays into protected standby mode."
        )
        recommendations.append(
            "Monitor star tracker centroiding noise and optical payload dark-current spikes induced by proton tracks."
        )
    elif radiation.score >= 40:
        recommendations.append(
            "Review payload command queues to ensure critical memory uploads avoid South Atlantic Anomaly (SAA) and polar horn crossings."
        )
        
    # 3. Spacecraft Charging & ESD Mitigations (GEO / high MEO / auroral)
    if charging.score >= 60:
        recommendations.append(
            "Monitor solar array differential bus potentials and payload grounding telemetry for electrostatic discharge (ESD) transients."
        )
        recommendations.append(
            "Avoid commanding non-essential mechanism actuations or solar array repositioning during peak magnetospheric substorm injections."
        )
    elif charging.score >= 40:
        recommendations.append(
            "Prepare telemetry alarms for unexpected threshold resets on external sensor interfaces."
        )
        
    # 4. Communications & Telemetry Link Mitigations
    if comms.score >= 60:
        recommendations.append(
            "Schedule redundant ground station passes outside daylight hours to mitigate D-region solar flare radio absorption."
        )
        recommendations.append(
            "Verify forward error correction (FEC) margins on critical telemetry downlinks."
        )
        
    # 5. Navigation & Timing Integrity
    if nav.score >= 60:
        recommendations.append(
            "Enable multi-GNSS receiver dual-frequency ionospheric-free carrier combination to mitigate severe TEC scintillation delays."
        )
        recommendations.append(
            "Cross-verify onboard autonomous orbit determination against ground radar range and range-rate tracking solutions."
        )
        
    # Ensure at least 3 baseline operational recommendations
    if len(recommendations) < 3:
        recommendations.append("Maintain standard space-weather monitoring cadence and verify telemetry health beacons.")
        recommendations.append("Verify autonomous safehold trigger limits and onboard fault detection, isolation, and recovery (FDIR) logic.")
        
    return recommendations[:6]
