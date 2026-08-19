# ORBITAL SHIELD 🛰️☀️
### AI-Powered Space Weather & Satellite Mission Risk Assessment Platform
**Developed for the ISRO Space Hackathon**

---

## 🌟 1. Executive Summary & Core Innovation

> **The Fundamental Problem:**  
> Traditional space weather forecasting systems stop at reporting solar flares and geomagnetic indices (*e.g., "Kp 7 geomagnetic storm expected"*). However, spacecraft operators cannot make operational decisions based solely on raw planetary indices.

> **The ORBITAL SHIELD Innovation:**  
> *"We don't just predict the space-weather event. We predict what that event means for a specific satellite and mission."*

ORBITAL SHIELD is an **AI-powered, physics-informed Space Weather Digital Twin and Decision-Support System** that maps the full causal chain:

```
Solar Activity (GOES X-Ray / CME Shock)
      ↓
Space Weather Forecast (NOAA SWPC / NASA DONKI)
      ↓
Satellite Environment (Van Allen Belts / Thermosphere / Ionosphere)
      ↓
Hardware Sensitivity (COTS vs Rad-Hard / Aluminum Shielding mm)
      ↓
Subsystem Impact (Drag, Radiation SEU, ESD Charging, Comms, Nav)
      ↓
Mission Risk Score (0 - 100 Weighted by Mission Objective)
      ↓
Explainable Prediction (SHAP-Style Feature Attribution: "WHY is this satellite at risk?")
      ↓
Operational Mitigation Advisories ("Consider solar array feathering / re-boost planning")
```

---

## 🏗️ 2. System Architecture

```
                                  ORBITAL SHIELD
┌─────────────────────────────────────────────────────────────────────────────┐
│                             NEXT.JS 16 FRONTEND                             │
│  - Futuristic Aerospace Mission Control UI (Tailwind CSS, Glassmorphism)    │
│  - Interactive Three.js 3D Earth Globe with Trajectory & Risk Glow          │
│  - Recharts Forward Risk Projection & Feature Attribution Visualizers       │
│  - What-If Interactive Sensitivity Sliders & Counterfactual Engine          │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ REST API (JSON)
┌──────────────────────────────────────▼──────────────────────────────────────┐
│                             FASTAPI BACKEND                                 │
│  - Modular REST Services & Pydantic Data Validation                         │
│  - Physics Engine (NRLMSISE Thermospheric Drag, Cutoff Rigidity, ESD)       │
│  - ML Engine (Flare Classification, Geomagnetic Storm Classifier)           │
│  - SHAP-Style Explainability & Operational Recommendation Generator         │
│  - Live NOAA SWPC / NASA DONKI Client + Realistic Scenario Fallbacks        │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## ⚛️ 3. Physics-Informed Modeling Formulations

### A. Aerodynamic Drag & Thermospheric Expansion
$$F_D = \frac{1}{2} C_d \rho v^2 A$$
$$\text{Ballistic Coefficient: } B = \frac{m}{C_d A}$$
$$\text{Orbital Decay Rate: } \frac{\Delta a}{\text{day}} = -2\pi \frac{C_d A}{m} \rho a^2 v \cdot \frac{86400}{T}$$
- **Solar Storm Heating:** Thermospheric density $\rho$ scales dynamically with geomagnetic Joule heating ($K_p$) and solar EUV radio flux ($F_{10.7}$).

### B. Ionizing Radiation & Magnetic Cutoff Rigidity
$$R_c = \frac{14.5 \cos^4 \lambda}{L^2} \text{ GV}$$
$$\text{Shielded Dose } \propto \text{Unshielded Flux} \cdot \exp(-\mu \cdot t_{Al})$$
- Evaluates Van Allen belt $L$-shell transit (inner proton belt vs outer relativistic electron belt) and exponential aluminum casing stopping power to predict Single Event Upset (SEU) rates.

### C. Spacecraft Dielectric Charging & ESD
$$V_{\text{diff}} = - (J_e - J_i) \cdot R_d$$
- High-energy relativistic electrons ($>2\text{ MeV}$) penetrating geostationary (GEO) blankets accumulate negative differential potentials up to $-15\text{ kV}$, triggering internal electrostatic discharge.

### D. Ionospheric Scintillation & Signal Loss
$$S_4 = \frac{\sigma_I}{\langle I \rangle}$$
- D-region X-ray ionization creates high-frequency (HF) radio blackouts on the sunlit hemisphere and ionospheric TEC gradients that induce $\pm 20\text{m}$ GNSS pseudorange positioning errors.

---

## 🗺️ 4. Application Routes

| Route | Module | Purpose |
|---|---|---|
| `/` | **Mission Control** | Real-time solar status, geomagnetic status, 3D interactive Earth orbit tracker, target risk score gauge, and active alerts. |
| `/forecast` | **AI Space Weather Forecast** | M-class and X-class flare probabilities, G1–G5 geomagnetic storm scales, solar wind speed & IMF $B_z$ 48h forward projections. |
| `/satellite` | **Digital Twin Builder** | Create/customize spacecraft specifications (orbit, mass, cross-section area, shielding thickness, subsystem sensitivities). |
| `/risk` | **Mission Risk Deep-Dive** | Detailed risk breakdowns across all 5 subsystems + **SHAP Explainability feature attribution waterfall** ("WHY is this spacecraft at risk?"). |
| `/simulation` | **What-If Simulator** | Interactive counterfactual sliders (altitude, mass, shielding, storm severity) with real-time before/after delta calculation and physical reasoning. |
| `/events` | **Historical Storm Replay** | Step-by-step interactive time-travel scrubber for the May 2024 G5 Storm, Oct 2024 X9.0 Mega-Flare, and Halloween 2003 Storms. |
| `/compare` | **Fleet Comparison** | Side-by-side multi-orbit evaluation (LEO vs MEO vs GEO) under identical space weather storm conditions. |
| `/about` | **Methodology & Docs** | Comprehensive scientific documentation, physics equations, data pipeline diagrams, and ISRO Space Hackathon context. |

---

## 🚀 5. Quick Start Instructions

### Prerequisites
- **Node.js**: v18+ (tested on Node v24)
- **Python**: v3.10+ (tested on Python 3.14)

### 1. Start the FastAPI Backend
```powershell
# In a terminal:
cd backend
python run.py
# Backend runs at http://127.0.0.1:8000 (API Docs at http://127.0.0.1:8000/docs)
```

### 2. Start the Next.js Frontend
```powershell
# In a second terminal:
cd frontend
npm run dev
# Frontend runs at http://localhost:3000
```

---

## 🧪 6. Hackathon Demonstration Flow (Step-by-Step)

1. **Step 1 — Mission Control Dashboard (`/`):** Open dashboard. Observe live space-weather telemetry (Solar Flare, Kp 8.7 Extreme Geomagnetic Storm, Solar Wind 840 km/s).
2. **Step 2 — AI Forecast (`/forecast`):** Inspect 48-hour forward projections for X-class solar flares, G5 storm probabilities, and solar wind velocity.
3. **Step 3 — Target Spacecraft (`/`):** Select **SAT-EO-01** (LEO, 550 km, $53^\circ$ Inc). Notice the Overall Mission Risk is **HIGH (78/100)** driven predominantly by **Atmospheric Drag (89/100)**.
4. **Step 4 — Explainable AI (`/risk`):** Click *"WHY IS RISK ELEVATED?"*. Review the SHAP-style attribution waterfall showing positive contributions from high Kp index (+25 pts), low altitude (+21 pts), and large area-to-mass ratio (+14 pts).
5. **Step 5 — What-If Simulator (`/simulation`):** Adjust the altitude slider from **550 km → 750 km**. Instantly watch Drag Risk plunge from **89 → 46 (-43 pts)** and Overall Risk drop to **MODERATE (52/100)**.
6. **Step 6 — Historical Replay (`/events`):** Select the **May 2024 "Mother's Day" G5 Storm**. Scrub through the timeline (T-48h through T+36h) to see model predictions validated against observed telemetry.
7. **Step 7 — Fleet Comparison (`/compare`):** Compare **SAT-EO-01** (LEO) vs **SAT-COM-01** (GEO) vs **SAT-NAV-01** (MEO) to demonstrate why LEO suffers drag while GEO suffers deep dielectric electrostatic charging.

---

## ⚖️ 7. Scientific Honesty & Ethics

- **Decision-Support Focus:** All model outputs represent *estimated risk indices* and *confidence intervals*.
- **Advisory Only:** Operational recommendations are phrased with non-coercive advisory language (*"Consider...", "Review...", "Monitor...", "Prepare..."*) and must never be represented as autonomous satellite commands.
- **Data Integrity:** Live data is fetched from NOAA Space Weather Prediction Center & NASA DONKI, with deterministic offline simulation fallbacks for uninterrupted hackathon demos.