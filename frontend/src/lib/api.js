// Thin API client for the Orbital Shield backend. Tries the live FastAPI
// service first and transparently falls back to the local physics estimator so
// the dashboard never hard-crashes when the backend is offline.
import { assessRiskOffline } from './fallback.js'

const API_BASE =
  (import.meta.env && import.meta.env.VITE_API_URL) || 'http://localhost:8000'

export async function assessRisk(payload) {
  try {
    const res = await fetch(`${API_BASE}/api/assess-risk`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!res.ok) {
      throw new Error(`backend responded ${res.status}`)
    }
    const data = await res.json()
    return { ...data, _source: 'backend', _apiBase: API_BASE }
  } catch (err) {
    return {
      ...assessRiskOffline(payload),
      _source: 'estimate',
      _error: String((err && err.message) || err),
      _apiBase: API_BASE,
    }
  }
}

export async function fetchHealth() {
  try {
    const res = await fetch(`${API_BASE}/api/health`)
    return res.ok ? await res.json() : null
  } catch {
    return null
  }
}
