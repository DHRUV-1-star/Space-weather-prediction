"""Train and persist the Orbital Shield Phase-2 ML models.

Two models are produced from the generated ``training_data.csv``:

* ``LEODragPredictor``  - XGBoost regressor of daily altitude loss [km/day]
  from F10.7, Kp, altitude, satellite mass and drag area.
* ``AnomalyClassifier`` - RandomForest multi-output classifier predicting the
  probability of a Single Event Upset (SEU) and of surface charging given
  proton/electron flux, Kp and the orbital regime.

The fitted estimators are dumped as ``.joblib`` files into ``ml/models/`` along
with a ``metadata.json`` that records the feature contracts for the router.
"""

from __future__ import annotations

import json
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
import xgboost as xgb
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, mean_absolute_error, mean_squared_error, r2_score, roc_auc_score
from sklearn.model_selection import train_test_split

from .features import (
    LEODRAG_FEATURES,
    REGIMES,
    anomaly_feature_names,
)

MODELS_DIR = Path(__file__).resolve().parent / "models"


# ---------------------------------------------------------------------------
# Model contracts (thin, functional wrappers)
# ---------------------------------------------------------------------------


class LEODragPredictor:
    """Daily altitude-loss regressor backed by a gradient-boosted tree ensemble."""

    def __init__(
        self,
        n_estimators: int = 400,
        max_depth: int = 6,
        learning_rate: float = 0.06,
        **kwargs,
    ) -> None:
        self.model = xgb.XGBRegressor(
            n_estimators=n_estimators,
            max_depth=max_depth,
            learning_rate=learning_rate,
            subsample=0.9,
            colsample_bytree=0.8,
            objective="reg:squarederror",
            random_state=42,
            n_jobs=-1,
            **kwargs,
        )
        self.features = list(LEODRAG_FEATURES)

    def fit(self, X: pd.DataFrame, y: pd.Series) -> "LEODragPredictor":
        self.model.fit(X[self.features], y)
        return self

    def predict(self, X: pd.DataFrame | np.ndarray) -> np.ndarray:
        return np.clip(self.model.predict(X), 0.0, None)


class AnomalyClassifier:
    """RandomForest multi-output classifier of SEU and surface-charging events."""

    OUTPUTS: tuple[str, str] = ("seu", "charging")

    def __init__(self, n_estimators: int = 300, max_depth: int = 10, **kwargs) -> None:
        self.model = RandomForestClassifier(
            n_estimators=n_estimators,
            max_depth=max_depth,
            min_samples_split=4,
            random_state=42,
            class_weight="balanced",
            n_jobs=-1,
            **kwargs,
        )
        self.features = anomaly_feature_names()
        self.labels = list(self.OUTPUTS)

    def fit(self, X: pd.DataFrame, Y: pd.DataFrame) -> "AnomalyClassifier":
        self.model.fit(X[self.features], Y[["seu_label", "charging_label"]])
        return self

    def predict_proba_pct(self, X: pd.DataFrame | np.ndarray) -> dict[str, np.ndarray]:
        """Return per-output positive-class probabilities in percent."""
        probas = self.model.predict_proba(X)
        result: dict[str, np.ndarray] = {}
        for i, label in enumerate(self.labels):
            arr = np.asarray(probas[i])
            result[label] = (arr[:, 1] * 100.0) if arr.ndim == 2 and arr.shape[1] > 1 else (arr[:, 0] * 100.0)
        return result


# ---------------------------------------------------------------------------
# Training pipeline
# ---------------------------------------------------------------------------


def train_all(csv_path: str | Path, out_dir: Path = MODELS_DIR, test_size: float = 0.2) -> dict:
    """Train both models, print evaluation metrics and persist artefacts."""
    out_dir = Path(out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)
    df = pd.read_csv(csv_path)

    # One-hot regime columns for the anomaly predictor.
    for r in REGIMES:
        df[f"regime_{r.lower()}"] = (df["regime"] == r).astype(int)

    # --- LEODragPredictor ---------------------------------------------------
    drag_features = list(LEODRAG_FEATURES)
    X_d = df[drag_features]
    y_d = df["daily_decay_km"]
    Xd_tr, Xd_te, yd_tr, yd_te = train_test_split(
        X_d, y_d, test_size=test_size, random_state=42
    )
    drag_model = LEODragPredictor().fit(Xd_tr, yd_tr)
    preds = drag_model.predict(Xd_te)
    drag_metrics = {
        "rmse_km_per_day": float(np.sqrt(mean_squared_error(yd_te, preds))),
        "mae_km_per_day": float(mean_absolute_error(yd_te, preds)),
        "r2": float(r2_score(yd_te, preds)),
    }

    # --- AnomalyClassifier --------------------------------------------------
    anomaly_features = anomaly_feature_names()
    targets = pd.DataFrame(
        {"seu_label": df["seu_label"], "charging_label": df["charging_label"]}
    )
    Xa = df[anomaly_features]
    Xa_tr, Xa_te, ya_tr, ya_te = train_test_split(
        Xa, targets, test_size=test_size, random_state=42, stratify=targets["seu_label"]
    )
    anomaly_model = AnomalyClassifier().fit(Xa_tr, ya_tr)
    probas = anomaly_model.predict_proba_pct(Xa_te)
    anomaly_metrics = {
        "acc_seu": float(accuracy_score  (ya_te["seu_label"], (probas["seu"] >= 50).astype(int))),
        "auc_seu": float(roc_auc_score(ya_te["seu_label"], probas["seu"] / 100.0)),
        "acc_charging": float(accuracy_score(ya_te["charging_label"], (probas["charging"] >= 50).astype(int))),
        "auc_charging": float(roc_auc_score(ya_te["charging_label"], probas["charging"] / 100.0)),
    }

    # --- persist ------------------------------------------------------------
    drag_path = out_dir / "leo_drag_predictor.joblib"
    anomaly_path = out_dir / "anomaly_classifier.joblib"
    # Persist the underlying sklearn/xgboost estimators (wrapper-safe serialization).
    joblib.dump(drag_model.model, drag_path)
    joblib.dump(anomaly_model.model, anomaly_path)

    metadata = {
        "drag" : {"model": "LEODragPredictor",
            "features": drag_features,
            "metrics": drag_metrics,
            "file": drag_path.name},
        "anomaly": {"classifier": "AnomalyClassifier",
            "features": anomaly_features,
            "labels": ["seu", "charging"],
            "metrics": anomaly_metrics,
            "file": anomaly_path.name},
        "n_rows": int(len(df)),
    }
    (out_dir / "metadata.json").write_text(json.dumps(metadata, indent=2))

    print("LEODragPredictor metrics:", drag_metrics)
    print("AnomalyClassifier metrics:", anomaly_metrics)
    print(f"Saved:")
    print(f"  {drag_path}")
    print(f"  {anomaly_path}")
    print(f"  {out_dir / 'metadata.json'}")
    return metadata


def main() -> int:
    import argparse

    parser = argparse.ArgumentParser(description="Train Orbital models.")
    parser.add_argument(
        "--data", default="training_data.csv", help="Path to training CSV."
    )
    parser.add_argument("--out", default=str(MODELS_DIR))
    args = parser.parse_args()
    train_all(args.data, args.out)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())


