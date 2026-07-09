"""Global daily request cap to limit total cost exposure."""

import json
import os
from datetime import date

from fastapi import HTTPException

MAX_DAILY_REQUESTS = 200
STORAGE_FILE = "storage/daily_usage.json"


def check_and_increment_daily():
    """Increment the daily counter and raise 429 if the limit is exceeded.

    Automatically resets the count when the stored date no longer matches
    today's date.  Creates the storage directory and file if they don't
    exist yet (graceful handling of ephemeral / first-run filesystems).
    """
    today = str(date.today())

    os.makedirs(os.path.dirname(STORAGE_FILE), exist_ok=True)

    try:
        with open(STORAGE_FILE, "r") as f:
            data = json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        data = {"date": today, "count": 0}

    if data.get("date") != today:
        data = {"date": today, "count": 0}

    if data["count"] >= MAX_DAILY_REQUESTS:
        raise HTTPException(
            status_code=429,
            detail="Daily request limit reached. Please try again tomorrow.",
        )

    data["count"] += 1
    with open(STORAGE_FILE, "w") as f:
        json.dump(data, f)
