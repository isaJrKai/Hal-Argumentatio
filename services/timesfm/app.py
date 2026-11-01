"""HAL's isolated TimesFM 2.5 inference service.

This service only forecasts supplied historical observations. It does not invent
training data, tenant data, weather effects, CAC, or business metrics.
"""
from __future__ import annotations

import os
import secrets
import threading
import time

import numpy as np
import timesfm
from fastapi import FastAPI, Header, HTTPException
from pydantic import BaseModel, Field, field_validator

MODEL_ID = os.getenv("TIMESFM_MODEL_ID", "google/timesfm-2.5-200m-pytorch")
API_KEY = os.getenv("TIMESFM_API_KEY", "")
MIN_CONTEXT = 8
MAX_CONTEXT = 1024
MAX_HORIZON = 52

app = FastAPI(title="HAL TimesFM Inference", version="1.0.0")
_model = None
_model_error: str | None = None
_model_lock = threading.Lock()
_inference_lock = threading.Lock()
_last_load_attempt = 0.0
LOAD_RETRY_COOLDOWN_SECONDS = 30


class ForecastRequest(BaseModel):
    series: list[float] = Field(min_length=MIN_CONTEXT, max_length=MAX_CONTEXT)
    horizon: int = Field(ge=1, le=MAX_HORIZON)
    @field_validator("series")
    @classmethod
    def validate_series(cls, values: list[float]) -> list[float]:
        if any(not np.isfinite(value) or value < 0 for value in values):
            raise ValueError("series values must be finite and non-negative")
        if len(set(values)) <= 1:
            raise ValueError("series must contain variation; a constant series is not forecastable")
        return values


def load_model():
    global _model, _model_error, _last_load_attempt
    with _model_lock:
        if _model is not None:
            return _model
        now = time.monotonic()
        if _model_error and now - _last_load_attempt < LOAD_RETRY_COOLDOWN_SECONDS:
            raise RuntimeError("TimesFM model load is temporarily unavailable; retry after cooldown")
        _last_load_attempt = now
        _model_error = None
        try:
            model = timesfm.TimesFM_2p5_200M_torch.from_pretrained(
                MODEL_ID,
            )
            model.compile(
                timesfm.ForecastConfig(
                    max_context=MAX_CONTEXT,
                    max_horizon=MAX_HORIZON,
                    per_core_batch_size=1,
                    normalize_inputs=True,
                    use_continuous_quantile_head=True,
                    force_flip_invariance=True,
                    infer_is_positive=True,
                    fix_quantile_crossing=True,
                )
            )
            _model = model
            return _model
        except Exception as exc:  # surfaced by readiness and inference routes
            _model_error = f"{type(exc).__name__}: {exc}"
            raise RuntimeError(_model_error) from exc


@app.on_event("startup")
def warm_model():
    # Avoid downloading model weights when the service has not been configured securely.
    if len(API_KEY) < 32:
        return
    # Keep the process alive if weights are temporarily unavailable; readiness
    # reports the failure and forecast requests return 503 rather than fake data.
    try:
        load_model()
    except Exception:
        pass


@app.get("/health")
def health():
    return {
        "status": "ready" if _model is not None and len(API_KEY) >= 32 else "unavailable",
        "model": MODEL_ID,
        "model_loaded": _model is not None,
        "api_key_configured": len(API_KEY) >= 32,
        "error_type": _model_error.split(":", 1)[0] if _model_error else None,
    }


@app.post("/forecast")
def forecast(request: ForecastRequest, authorization: str | None = Header(default=None)):
    if len(API_KEY) < 32:
        raise HTTPException(status_code=503, detail="TIMESFM_API_KEY must be configured with at least 32 characters")
    expected_authorization = f"Bearer {API_KEY}"
    if not secrets.compare_digest(authorization or "", expected_authorization):
        raise HTTPException(status_code=401, detail="Unauthorized")

    try:
        model = load_model()
        with _inference_lock:
            point, quantiles = model.forecast(
                horizon=request.horizon,
                inputs=[np.asarray(request.series, dtype=np.float32)],
            )
        point_values = np.asarray(point[0], dtype=float)
        quantile_values = np.asarray(quantiles[0], dtype=float)

        if point_values.shape[0] != request.horizon or quantile_values.shape != (request.horizon, 10):
            raise ValueError("Unexpected TimesFM output shape")

        result = []
        for index in range(request.horizon):
            values = [
                float(point_values[index]),
                float(quantile_values[index, 1]),
                float(quantile_values[index, 9]),
            ]
            if not all(np.isfinite(value) for value in values):
                raise ValueError("TimesFM returned a non-finite forecast")
            median, lower, upper = values
            result.append({
                "step": index + 1,
                "point": max(0.0, median),
                "lower": max(0.0, min(lower, median)),
                "upper": max(median, upper),
            })

        return {
            "success": True,
            "model": MODEL_ID,
            "version": "2.5",
            "backend": "pytorch",
            "input_points": len(request.series),
            "horizon": request.horizon,
            "forecast": result,
        }
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(
            status_code=503,
            detail=f"TimesFM inference unavailable: {type(exc).__name__}",
        ) from exc
