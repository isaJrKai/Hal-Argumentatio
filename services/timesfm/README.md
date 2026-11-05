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

## Optional on-demand HTTP inference mode

- `TIMESFM_SERVICE_URL`: base URL of the deployed service, e.g. `https://your-private-service.example`.
- `TIMESFM_API_KEY`: the same random secret (at least 32 characters) configured in the inference service.
- `HF_TOKEN` (optional): Hugging Face read token only if anonymous checkpoint downloads are rate-limited. Never use it as `TIMESFM_API_KEY`.

These two HAL environment variables are needed only for on-demand HTTP inference. HAL can instead use the scheduled batch path below without paying for a continuously running model server.

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
running inference server. When no private HTTP endpoint is configured, HAL's
forecast API reads the latest successful, fresh, tenant- and territory-scoped
batch results from the existing `forecasts` table. The workflow at
`.github/workflows/timesfm-batch.yml` runs the official TimesFM 2.5 PyTorch
checkpoint on a GitHub-hosted runner, reads tenant-scoped Google Ads history
for each contractor's active territories and primary service type, and writes
the median forecast plus q10/q90 bounds into the existing `forecasts` table.
Other niche selections require the optional HTTP inference mode. It is a
scheduled batch job, not a live HTTP inference API.

### Real Google Ads history ingestion

The authenticated tenant endpoint `POST /api/forecasting/google-ads/sync` is
available from Settings using **Verify & import last 365 days**. The credential
object is stored in the existing contractor-scoped encrypted connector vault
and is never returned to the browser.

Required JSON fields: `clientId`, `clientSecret`, `refreshToken`, `developerToken`, and
10-digit `customerId`. Optional: `loginCustomerId` for manager-account access. The refresh token must be authorized
for `https://www.googleapis.com/auth/adwords` with offline access. Google's current user-auth flow requires passkey authentication when generating new refresh tokens, and the Ads scope is restricted, so production OAuth app verification is required. HAL refreshes
the token server-side, queries Google Ads v26 city-level geographic performance
for the last 365 days, resolves city names, and idempotently upserts daily
campaign/city observations into the same tenant's
`google_ads_daily_performance` table. Only physical-presence geography is
imported. The TimesFM batch job subsequently filters campaign names against the
tenant's service type; campaign names must identify the trade for forecasts to
be eligible. OAuth success with zero imported rows is not successful ingestion.

### Required setup

1. In the GitHub repository, open **Settings → Secrets and variables → Actions**.
2. Add repository secret `HAL_FORECAST_DATABASE_URL` containing a PostgreSQL
   connection string for a dedicated least-privilege database role.
3. Create a dedicated login role (run as a database administrator and replace
   the role/database placeholders securely):

   ```sql
   CREATE ROLE hal_timesfm_batch LOGIN PASSWORD '<generate-a-unique-secret>';
   GRANT CONNECT ON DATABASE <database_name> TO hal_timesfm_batch;
   GRANT USAGE ON SCHEMA public TO hal_timesfm_batch;
   GRANT SELECT (id, city, service_type, active_territories)
     ON TABLE public.contractors TO hal_timesfm_batch;
   GRANT SELECT (contractor_id, date, conversions, cost, geo, campaign_name, keyword, search_term)
     ON TABLE public.google_ads_daily_performance TO hal_timesfm_batch;
   GRANT SELECT (id) ON TABLE public.forecasts TO hal_timesfm_batch;
   GRANT INSERT (id, contractor_id, metric, predicted, confidence_score, target_date,
                 model_version, assumptions, created_at, updated_at)
     ON TABLE public.forecasts TO hal_timesfm_batch;
   GRANT UPDATE (predicted, confidence_score, assumptions, updated_at)
     ON TABLE public.forecasts TO hal_timesfm_batch;
   ```

   Do not grant table ownership, `DELETE`, `TRUNCATE`, `CREATE`, or `BYPASSRLS`.
   Store the URL only as the GitHub Actions secret `HAL_FORECAST_DATABASE_URL`;
   never commit it or print it in logs.
4. Run **Actions → HAL TimesFM scheduled forecasts → Run workflow** manually
   after verifying grants and confirming genuine Google Ads history exists.
   Scheduled runs execute from `main` every six hours after workflow merge.

The workflow does not print connection strings, customer records, or model
inputs. Do not enable verbose SQL logging or add personal/customer fields to
workflow logs.

### Historical data ingestion status

A tenant-authenticated Google Ads API ingestion endpoint is now implemented at
`POST /api/forecasting/google-ads/sync`. It uses the current encrypted
workspace credential, queries city-level physical-presence daily performance,
resolves Google geo-target city names, and upserts tenant-owned records
idempotently. It does not invent missing days or fabricate sample rows. The
batch runner consumes only rows whose city and campaign text match the selected
territory and service type.

The code path and its input/query contracts are covered by CI tests. However,
no production Google Ads OAuth consent, live account query, or Neon row count
has yet been verified. The ingestion feature is therefore implemented but
production-unverified until a workspace owner saves valid OAuth credentials and
the UI reports a non-zero imported row count. The database table existing by
itself is not proof of genuine historical ingestion.

### Resource and product limitations

- The GitHub-hosted runner has finite memory. The initial batch configuration
  caps context at 256 weekly points and processes one contractor at a time.
  This is a conservative test configuration, not an accuracy guarantee.
- The job may fail if the runner cannot load the model within its memory or
  time limits. A failed run does not delete or overwrite the last successful
  forecasts.
- Forecasts are refreshed on the schedule, not immediately on dashboard
  interaction. The first target is the later of the week after the last complete
  observed week and the next UTC week, keeping the full target week in the future and preventing expired targets from stale
  history. HAL reads only a fresh complete snapshot (up to 24 hours old).
- TimesFM conversion forecasts are evaluated only after their complete target
  Monday-Sunday week has elapsed, against the same tenant's Google Ads daily
  conversion observations filtered to the forecast city and service type. At
  least five observed days spanning Monday-Friday are required; missing history
  is not interpreted as zero. Outcomes and source-window provenance are persisted.
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
