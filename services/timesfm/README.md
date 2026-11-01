# HAL TimesFM 2.5 inference service

This is a separate Python inference process. The Node/Express application calls it
through `TIMESFM_SERVICE_URL` and authenticates with `TIMESFM_API_KEY`.

## Build and run

```sh
docker build -t hal-timesfm services/timesfm
docker run --rm -p 8080:8080 \
  -e TIMESFM_API_KEY='replace-with-a-long-random-secret' \
  -v hal-timesfm-cache:/opt/huggingface \
  hal-timesfm
```

The service downloads the public Google TimesFM 2.5 PyTorch checkpoint from Hugging Face on first startup. No Google API key and no Hugging Face token are required for the public checkpoint. If Hugging Face rate limits anonymous downloads, an optional read-only `HF_TOKEN` can be supplied as an environment variable; it is not the HAL service authentication key.

The configured 1,024-point context is in the upstream standard tier: target a CPU host with 16 GB RAM, or a supported GPU with 4–8 GB VRAM. The upstream guide lists 4–8 GB system RAM for a smaller 512-point context. The service uses a single-series batch size to limit memory use. Persist `/opt/huggingface` (as in the Docker volume example) so restarts do not repeatedly download the roughly 1 GB checkpoint/cache.

## Required HAL application environment

- `TIMESFM_SERVICE_URL`: base URL of the deployed service, e.g. `https://your-private-service.example`.
- `TIMESFM_API_KEY`: the same random secret (at least 32 characters) configured in the inference service.
- `HF_TOKEN` (optional): Hugging Face read token only if anonymous checkpoint downloads are rate-limited. Never use it as `TIMESFM_API_KEY`.

Do not expose the service publicly without HTTPS and the bearer token. Keep the
service private where the hosting platform supports private networking.

## Contract and truthfulness rules

- Forecast requests contain weekly tenant-scoped historical conversion totals.
- HAL requires at least eight complete, contiguous weeks; each week must have at least five observed days. An incomplete boundary week is ignored, while gaps inside the series fail closed.
- Inputs must be finite, non-negative, and non-constant.
- Horizon is limited to 1–52 weeks.
- The service returns the TimesFM median plus q10/q90 quantile bounds.
- Missing configuration, missing weights, invalid inputs, or inference failures
  return an error. There is no synthetic or heuristic fallback.
- Weather is not currently a TimesFM covariate. HAL displays weather as context
  only and does not multiply the model forecast by an assumed weather uplift.
- HAL currently forecasts conversion demand only. CPL is shown as the trailing
  observed baseline and must not be described as a model-generated CPL forecast.

The service deliberately uses the TimesFM 2.5 checkpoint, not TimesFM 3.0. The upstream project states that pretrained weights through 2.5 remain Apache-2.0, while TimesFM 3.0's default pretrained weights are under a non-commercial, non-production license. Do not switch model IDs for this commercial product without reviewing the applicable license first.


## Free development/testing runner: GitHub Actions

HAL can generate periodic TimesFM forecasts without operating a continuously
running inference server. The workflow at
`.github/workflows/timesfm-batch.yml` runs the official TimesFM 2.5 PyTorch
checkpoint on a GitHub-hosted runner, reads each contractor's own Google Ads
history, and writes the median forecast plus q10/q90 bounds into the existing
`forecasts` table. It is a scheduled batch job, not a live HTTP inference API.

### Required setup

1. In the GitHub repository, open **Settings → Secrets and variables → Actions**.
2. Add repository secret `HAL_FORECAST_DATABASE_URL` containing a PostgreSQL
   connection string for a dedicated least-privilege database role.
3. Grant that role only the permissions needed to read `contractors` and
   `google_ads_daily_performance`, and insert/update rows in `forecasts`.
   Do not use a database owner or admin credential.
4. Run **Actions → HAL TimesFM scheduled forecasts → Run workflow** manually
   to test. Scheduled runs execute from `main` every six hours after this
   workflow is merged into the default branch.

The workflow does not print connection strings, customer records, or model
inputs. Do not enable verbose SQL logging or add personal/customer fields to
workflow logs.

### Resource and product limitations

- The GitHub-hosted runner has finite memory. The initial batch configuration
  caps context at 256 weekly points and processes one contractor at a time.
  This is a conservative test configuration, not an accuracy guarantee.
- The job may fail if the runner cannot load the model within its memory or
  time limits. A failed run does not delete or overwrite the last successful
  forecasts.
- Forecasts are refreshed on the schedule, not immediately on dashboard
  interaction. HAL should show the forecast generation timestamp and retain
  the last successful result when a later run fails.
- The `confidence_score` field is set to zero because a calibrated confidence
  score has not been established. q10/q90 values are stored separately in
  `assumptions`; they are model quantile bounds, not a guarantee.
- This free workflow is suitable for development, demonstration, and limited
  trial operation. It is not a paid-service SLA or guaranteed always-on
  inference endpoint. A buyer can later deploy the same TimesFM 2.5 service
  on appropriately sized paid compute for on-demand inference.

The workflow requires the GitHub Actions repository secret above. No secret
is included in source control. Do not enable or run it against production
customer data until the dedicated database role and access policy have been
reviewed.
