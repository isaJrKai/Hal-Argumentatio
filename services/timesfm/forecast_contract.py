"""Small, dependency-free date contract shared by the TimesFM batch runner and tests."""
from __future__ import annotations
from datetime import date, timedelta
import re


def first_target_week(last_observed_week: date, today: date) -> date:
    """Return the first forecast Monday without emitting stale target weeks."""
    last_monday = last_observed_week - timedelta(days=last_observed_week.weekday())
    current_monday = today - timedelta(days=today.weekday())
    next_monday = current_monday + timedelta(days=7)
    return max(last_monday + timedelta(days=7), next_monday)


GENERIC_TRADE_WORDS = {"contractor", "contractors", "service", "services", "company", "companies", "business", "businesses", "llc", "inc", "the", "and", "of"}


def matches_trade_context(campaign_text: str, niche: str) -> bool:
    haystack = campaign_text.strip().lower()
    requested = niche.strip().lower()
    if not haystack or not requested:
        return False
    if requested in haystack:
        return True
    tokens = [token for token in re.split(r"[^a-z0-9]+", requested)
              if len(token) >= 3 and token not in GENERIC_TRADE_WORDS]
    return any(token in haystack for token in tokens) if tokens else requested in haystack


def validate_batch_result(contractor_territory_count: int, generated_forecast_count: int) -> None:
    if contractor_territory_count < 1:
        raise RuntimeError("No contractor territories were found in the configured database; verify HAL_FORECAST_DATABASE_URL.")
    if generated_forecast_count < 1:
        raise RuntimeError("No TimesFM forecasts were generated from eligible tenant histories; import verified Google Ads history and retry.")
