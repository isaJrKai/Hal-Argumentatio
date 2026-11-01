# HAL TimesFM 2.5 inference service

This is a separate Python inference process. The Node/Express application calls it
through `TIMESFM_SERVICE_URL` and authenticates with `TIMESFM_API_KEY`.

## Build and run

```sh
docker build -t hal-timesfm services/timesfm
docker run --rm -p 8080:8080 \
  -e TIMESFM_API_KEY='replace-with-a-long-random-secret' \
  hal-timesfm
```

The service downloads and caches the Google TimesFM 2.5 PyTorch checkpoint on
first startup. At the configured 1,024-point context, plan for at least 2 GB RAM;
4 GB is a safer deployment target for runtime headroom. Persist the Hugging Face
cache so restarts do not repeatedly download the checkpoint.

## Required HAL application environment

- `TIMESFM_SERVICE_URL`: base URL of the deployed service, e.g. `https://your-private-service.example`.
- `TIMESFM_API_KEY`: the same random secret (at least 32 characters) configured in the inference service.

Do not expose the service publicly without HTTPS and the bearer token. Keep the
service private where the hosting platform supports private networking.

## Contract and truthfulness rules

- Forecast requests contain weekly tenant-scoped historical conversion totals.
- At least eight finite, non-negative, non-constant observations are required.
- Horizon is limited to 1–52 weeks.
- The service returns the TimesFM median plus q10/q90 quantile bounds.
- Missing configuration, missing weights, invalid inputs, or inference failures
  return an error. There is no synthetic or heuristic fallback.
- Weather is not currently a TimesFM covariate. HAL displays weather as context
  only and does not multiply the model forecast by an assumed weather uplift.
- HAL currently forecasts conversion demand only. CPL is shown as the trailing
  observed baseline and must not be described as a model-generated CPL forecast.

The service uses the TimesFM 2.5 checkpoint, not TimesFM 3.0.
