import hmac
import os
from typing import Any

import numpy as np
from fastapi import FastAPI, Header, HTTPException
from pydantic import BaseModel, Field

app = FastAPI(title="HAL TimesFM Inference", version="1.0.0")
model: Any = None
model_error: str | None = None
MODEL_ID = "google/timesfm-2.5-200m-pytorch"


class SeriesInput(BaseModel):
    conversions: list[float] = Field(min_length=14, max_length=512)
    cost: list[float] = Field(min_length=14, max_length=512)


class ForecastInput(BaseModel):
    city: str = Field(min_length=1, max_length=120)
    niche: str = Field(min_length=1, max_length=120)
    horizonDays: int = Field(ge=7, le=84)
    history: SeriesInput


@app.on_event("startup")
def load_model() -> None:
    global model, model_error
    try:
        import torch
        import timesfm

        torch.set_float32_matmul_precision("high")
        loaded = timesfm.TimesFM_2p5_200M_torch.from_pretrained(MODEL_ID)
        loaded.compile(
            timesfm.ForecastConfig(
                max_context=512,
                max_horizon=128,
                normalize_inputs=True,
                use_continuous_quantile_head=True,
                force_flip_invariance=True,
                infer_is_positive=True,
                fix_quantile_crossing=True,
            )
        )
        model = loaded
        model_error = None
    except Exception as exc:
        model = None
        model_error = str(exc)[:500]
        print("TimesFM model failed to load:", model_error)


def require_service_token(authorization: str | None) -> None:
    expected = os.getenv("TIMESFM_API_TOKEN", "")
    if not expected:
        raise HTTPException(status_code=503, detail="TIMESFM_API_TOKEN is not configured on the inference service.")
    supplied = authorization.removeprefix("Bearer ").strip() if authorization else ""
    if not supplied or not hmac.compare_digest(supplied, expected):
        raise HTTPException(status_code=401, detail="Unauthorized")


@app.get("/health")
def health() -> dict[str, Any]:
    return {
        "status": "ready" if model is not None else "unavailable",
        "model": MODEL_ID,
        "modelLoaded": model is not None,
        "error": model_error,
    }


@app.post("/forecast")
def forecast(payload: ForecastInput, authorization: str | None = Header(default=None)) -> dict[str, Any]:
    require_service_token(authorization)
    if model is None:
        raise HTTPException(status_code=503, detail="TimesFM model weights are not loaded.")

    conversions = np.asarray(payload.history.conversions, dtype=np.float32)
    cost = np.asarray(payload.history.cost, dtype=np.float32)
    if len(conversions) != len(cost):
        raise HTTPException(status_code=400, detail="Conversion and cost history lengths must match.")
    if not np.isfinite(conversions).all() or not np.isfinite(cost).all():
        raise HTTPException(status_code=400, detail="History values must be finite.")
    if (conversions < 0).any() or (cost < 0).any():
        raise HTTPException(status_code=400, detail="History values cannot be negative.")
    if conversions.sum() <= 0:
        raise HTTPException(status_code=422, detail="No recorded conversions exist in the supplied history.")

    try:
        point, quantiles = model.forecast(
            horizon=payload.horizonDays,
            inputs=[conversions, cost],
        )
        def pack(index: int) -> dict[str, list[float]]:
            return {
                "mean": [max(0.0, float(v)) for v in quantiles[index, :, 0]],
                "q10": [max(0.0, float(v)) for v in quantiles[index, :, 1]],
                "q50": [max(0.0, float(v)) for v in quantiles[index, :, 5]],
                "q90": [max(0.0, float(v)) for v in quantiles[index, :, 9]],
            }
        return {
            "model": MODEL_ID,
            "city": payload.city,
            "niche": payload.niche,
            "horizonDays": payload.horizonDays,
            "historyPoints": len(conversions),
            "series": {
                "conversions": pack(0),
                "cost": pack(1),
            },
        }
    except Exception as exc:
        raise HTTPException(status_code=502, detail="TimesFM inference failed: " + str(exc)[:300])
