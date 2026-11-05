"""Small, dependency-free date contract shared by the TimesFM batch runner and tests."""
from __future__ import annotations
from datetime import date, timedelta


def first_target_week(last_observed_week: date, today: date) -> date:
    """Return the first forecast Monday without emitting stale target weeks."""
    last_monday = last_observed_week - timedelta(days=last_observed_week.weekday())
    current_monday = today - timedelta(days=today.weekday())
    next_monday = current_monday + timedelta(days=7)
    return max(last_monday + timedelta(days=7), next_monday)
