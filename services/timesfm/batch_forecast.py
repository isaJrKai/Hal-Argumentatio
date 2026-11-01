"""Scheduled, tenant-scoped TimesFM batch forecasting for HAL.

Reads only contractors' own Google Ads performance rows, generates TimesFM 2.5
forecasts, and idempotently upserts them into the existing forecasts table.
No credentials or source records are printed.
"""
from __future__ import annotations

import hashlib
import json
import os
from datetime import date, datetime, timedelta, timezone

import numpy as np
import psycopg
from psycopg.rows import dict_row
import timesfm

DATABASE_URL = os.environ["DATABASE_URL"]
MODEL_ID = "google/timesfm-2.5-200m-pytorch"
MODEL_VERSION = "timesfm-2.5-batch-v1"
HORIZON = int(os.getenv("TIMESFM_BATCH_HORIZON", "12"))
MAX_CONTEXT = int(os.getenv("TIMESFM_BATCH_MAX_CONTEXT", "256"))


def weekly_series(rows: list[dict]) -> list[tuple[date, float]]:
    buckets: dict[date, dict] = {}
    for row in rows:
        day = row["date"].date() if isinstance(row["date"], datetime) else row["date"]
        monday = day - timedelta(days=day.weekday())
        bucket = buckets.setdefault(monday, {"total": 0.0, "days": set()})
        bucket["total"] += float(row["conversions"] or 0)
        bucket["days"].add(day)

    complete = []
    for monday, bucket in sorted(buckets.items()):
        days = sorted(bucket["days"])
        if len(days) >= 5 and (days[0] - monday).days <= 1 and (days[-1] - monday).days >= 4:
            complete.append((monday, bucket["total"]))

    if len(complete) < 8:
        return []
    for previous, current in zip(complete, complete[1:]):
        if (current[0] - previous[0]).days != 7:
            return []
    return complete[-MAX_CONTEXT:]


def make_model():
    model = timesfm.TimesFM_2p5_200M_torch.from_pretrained(MODEL_ID)
    model.compile(timesfm.ForecastConfig(
        max_context=MAX_CONTEXT,
        max_horizon=HORIZON,
        per_core_batch_size=1,
        normalize_inputs=True,
        use_continuous_quantile_head=True,
        force_flip_invariance=True,
        infer_is_positive=True,
        fix_quantile_crossing=True,
    ))
    return model


def main() -> None:
    if not 1 <= HORIZON <= 52 or not 8 <= MAX_CONTEXT <= 16384:
        raise ValueError("Invalid TimesFM batch horizon/context configuration")

    model = make_model()
    generated = 0
    skipped = 0
    now = datetime.now(timezone.utc)

    with psycopg.connect(DATABASE_URL, row_factory=dict_row, connect_timeout=20) as conn:
        contractors = conn.execute(
            """
            SELECT DISTINCT c.id, c.service_type, territory.city
            FROM contractors AS c
            CROSS JOIN LATERAL unnest(
                CASE
                    WHEN c.active_territories IS NOT NULL AND cardinality(c.active_territories) > 0
                    THEN array_append(c.active_territories, c.city)
                    ELSE ARRAY[c.city]
                END
            ) AS territory(city)
            WHERE c.city <> ''
              AND c.service_type <> ''
              AND territory.city IS NOT NULL
              AND btrim(territory.city) <> ''
            ORDER BY c.id, territory.city
            """
        ).fetchall()

        for contractor in contractors:
            city = str(contractor["city"]).strip().lower()
            niche = str(contractor["service_type"]).strip().lower()
            if not city or not niche:
                skipped += 1
                continue

            rows = conn.execute(
                """
                SELECT date, conversions, cost, geo, campaign_name, keyword, search_term
                FROM google_ads_daily_performance
                WHERE contractor_id = %s
                ORDER BY date ASC
                """,
                (contractor["id"],),
            ).fetchall()

            # Mirror the application's territory matching: both city and trade
            # must be explicitly present in geo + campaign/keyword/search-term text.
            scoped = []
            for row in rows:
                geo = str(row["geo"] or "").strip().lower()
                trade_text = " ".join(
                    str(row[key] or "") for key in ("campaign_name", "keyword", "search_term")
                ).strip().lower()
                if city in geo and niche in trade_text:
                    scoped.append(row)

            weeks = weekly_series(scoped)
            if len(weeks) < 8:
                skipped += 1
                continue

            values = np.asarray([value for _, value in weeks], dtype=np.float32)
            if not np.isfinite(values).all() or np.all(values == values[0]) or not np.any(values > 0):
                skipped += 1
                continue

            point, quantiles = model.forecast(
                horizon=HORIZON,
                inputs=[values],
            )
            medians = np.asarray(point[0], dtype=float)
            quantile_rows = np.asarray(quantiles[0], dtype=float)
            if medians.shape != (HORIZON,) or quantile_rows.shape != (HORIZON, 10):
                raise RuntimeError("TimesFM returned an unexpected output shape")

            batch_rows = []
            last_week = weeks[-1][0]
            today_utc = datetime.now(timezone.utc).date()
            next_monday = today_utc - timedelta(days=today_utc.weekday()) + timedelta(days=7)
            first_forecast_week = max(last_week + timedelta(days=7), next_monday)
            total_cost = sum(float(row["cost"] or 0) for row in scoped)
            total_conversions = sum(float(row["conversions"] or 0) for row in scoped)
            observed_cpl = total_cost / total_conversions if total_conversions > 0 else 0.0
            observed_days = {
                row["date"].date() if isinstance(row["date"], datetime) else row["date"]
                for row in scoped
            }
            historical_mean = float(np.mean(values))
            for index in range(HORIZON):
                median = float(medians[index])
                lower = float(quantile_rows[index, 1])
                upper = float(quantile_rows[index, 9])
                if not all(np.isfinite(v) for v in (median, lower, upper)):
                    raise RuntimeError("TimesFM returned non-finite forecast values")
                median = max(0.0, median)
                lower = max(0.0, min(lower, median))
                upper = max(median, upper)
                target_date = datetime.combine(
                    last_week + timedelta(days=7 * (index + 1)),
                    datetime.min.time(),
                    tzinfo=timezone.utc,
                )
                forecast_id = hashlib.sha256(
                    f"{contractor['id']}|{city}|{niche}|{target_date.date()}|{MODEL_VERSION}".encode()
                ).hexdigest()
                assumptions = json.dumps({
                    "source": "google_ads_daily_performance",
                    "territory_city": contractor["city"],
                    "territory_trade": contractor["service_type"],
                    "input_weeks": len(weeks),
                    "input_records": len(scoped),
                    "input_days": len(observed_days),
                    "input_total_cost": total_cost,
                    "input_total_conversions": total_conversions,
                    "observed_cpl_usd": observed_cpl,
                    "historical_mean": historical_mean,
                    "input_start_week": weeks[0][0].isoformat(),
                    "input_end_week": last_week.isoformat(),
                    "quantile_lower": 0.1,
                    "quantile_median": 0.5,
                    "quantile_upper": 0.9,
                    "lower": lower,
                    "upper": upper,
                    "generated_at": now.isoformat(),
                    "scheduler": "github-actions",
                }, separators=(",", ":"))
                batch_rows.append((
                    forecast_id, contractor["id"], "conversions", median,
                    0.0, target_date, MODEL_VERSION, assumptions, now,
                ))

            with conn.transaction():
                conn.executemany(
                    """
                    INSERT INTO forecasts
                      (id, contractor_id, metric, predicted, confidence_score,
                       target_date, model_version, assumptions, created_at, updated_at)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    ON CONFLICT (id) DO UPDATE SET
                      predicted = EXCLUDED.predicted,
                      confidence_score = EXCLUDED.confidence_score,
                      assumptions = EXCLUDED.assumptions,
                      updated_at = EXCLUDED.updated_at
                    """,
                    [(*row[:8], row[8], row[8]) for row in batch_rows],
                )
            generated += len(batch_rows)

    print(f"TimesFM batch complete: {generated} forecast points saved; {skipped} contractor-territories skipped.")
    if generated == 0:
        print("No contractor-territories had enough eligible history yet; no forecasts were changed.")


if __name__ == "__main__":
    main()
