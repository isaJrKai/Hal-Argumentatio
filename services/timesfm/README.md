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
