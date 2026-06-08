#!/usr/bin/env python3
"""Fetch placed applications for one or more programs and store them in SQLite."""

from __future__ import annotations

import argparse
import re
import sqlite3
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

try:
    import requests
except ImportError as exc:  # pragma: no cover - import guard
    raise SystemExit("Missing dependency 'requests'. Install it with: pip install requests python-dotenv") from exc

try:
    from dotenv import load_dotenv
except ImportError as exc:  # pragma: no cover - import guard
    raise SystemExit(
        "Missing dependency 'python-dotenv'. Install it with: pip install requests python-dotenv"
    ) from exc

import os


API_BASE_URL = "https://api.secure-platform.com/v2"
DEFAULT_PAGE_SIZE = 100
PLACED_TABLE = "placed_applications"
BOOK_AWARDS_PROGRAM_ID = 66
BOOK_TITLE_ALIAS = "tittleOfBook"
BOOK_AUTHOR_ALIAS = "titleOfBook"
EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Fetch placed applications for one or more OpenWater programs and store them in SQLite.",
    )
    parser.add_argument(
        "--program-id",
        type=int,
        action="append",
        required=True,
        help="OpenWater program id to fetch. Repeat the flag to fetch multiple programs.",
    )
    parser.add_argument(
        "--db",
        default="placed_applications.db",
        help="Path to the output SQLite database file (default: placed_applications.db)",
    )
    parser.add_argument(
        "--page-size",
        type=int,
        default=DEFAULT_PAGE_SIZE,
        help=f"Applications page size (default: {DEFAULT_PAGE_SIZE})",
    )
    parser.add_argument(
        "--max-pages",
        type=int,
        help="Optional page limit for testing",
    )
    parser.add_argument(
        "--verbose",
        action="store_true",
        help="Print per-application decisions",
    )
    return parser.parse_args()


def load_environment() -> dict[str, str]:
    repo_root = Path(__file__).resolve().parents[1]
    env_path = repo_root / ".env"
    load_dotenv(env_path)

    api_key = os.getenv("VITE_OPEN_WATER_API_KEY") or os.getenv("OPEN_WATER_API_KEY")
    client_key = os.getenv("VITE_OPEN_WATER_CLIENT_KEY") or os.getenv("OPEN_WATER_CLIENT_KEY")
    organization_code = os.getenv("OPEN_WATER_ORGANIZATION_CODE") or os.getenv("VITE_OPEN_WATER_ORGANIZATION_CODE")

    missing = []
    if not api_key:
        missing.append("VITE_OPEN_WATER_API_KEY")
    if not client_key:
        missing.append("VITE_OPEN_WATER_CLIENT_KEY")

    if missing:
        joined = ", ".join(missing)
        raise SystemExit(f"Missing required credentials in .env: {joined}")

    headers = {
        "Accept": "application/json",
        "X-ApiKey": api_key,
        "X-ClientKey": client_key,
        "X-SuppressEmails": "true",
    }

    if organization_code:
        headers["X-OrganizationCode"] = organization_code

    return headers


def request_json(session: requests.Session, url: str, *, params: dict[str, Any] | None = None) -> dict[str, Any]:
    response = session.get(url, params=params, timeout=30)
    response.raise_for_status()
    return response.json()


def iter_application_ids(
    session: requests.Session,
    program_id: int,
    page_size: int,
    max_pages: int | None,
) -> list[int]:
    page_index = 0
    ids: list[int] = []

    while True:
        if max_pages is not None and page_index >= max_pages:
            break

        payload = request_json(
            session,
            f"{API_BASE_URL}/Applications",
            params={
                "programId": program_id,
                "pageIndex": page_index,
                "pageSize": page_size,
            },
        )

        for item in payload.get("items") or []:
            app_id = item.get("id")
            if isinstance(app_id, int):
                ids.append(app_id)

        paging_info = payload.get("pagingInfo") or {}
        if not paging_info.get("hasNextPage"):
            break

        page_index += 1

    return ids


def parse_datetime(value: str | None) -> datetime:
    if not value:
        return datetime.min.replace(tzinfo=timezone.utc)

    normalized = value.replace("Z", "+00:00")
    try:
        return datetime.fromisoformat(normalized)
    except ValueError:
        return datetime.min.replace(tzinfo=timezone.utc)


def pick_round(application: dict[str, Any]) -> dict[str, Any] | None:
    rounds = application.get("roundSubmissions") or []
    if not rounds:
        return None

    finalized = [round_data for round_data in rounds if round_data.get("finalizedAtUtc")]
    if finalized:
        finalized.sort(key=lambda round_data: parse_datetime(round_data.get("finalizedAtUtc")), reverse=True)
        return finalized[0]

    sorted_rounds = list(rounds)
    sorted_rounds.sort(key=lambda round_data: parse_datetime(round_data.get("updatedAtUtc")), reverse=True)
    return sorted_rounds[0]


def normalize_placement(winner_types: list[Any] | None) -> str | None:
    if not winner_types:
        return None

    mapping = {
        "1st": "1st place",
        "1st place": "1st place",
        "first": "1st place",
        "first place": "1st place",
        "2nd": "2nd place",
        "2nd place": "2nd place",
        "second": "2nd place",
        "second place": "2nd place",
        "3rd": "3rd place",
        "3rd place": "3rd place",
        "third": "3rd place",
        "third place": "3rd place",
        "honorable mention": "honorable mention",
        "honourable mention": "honorable mention",
    }
    priority = {
        "1st place": 1,
        "2nd place": 2,
        "3rd place": 3,
        "honorable mention": 4,
    }
    placements = []

    for winner_type in winner_types:
        cleaned = " ".join(str(winner_type).strip().lower().replace("-", " ").split())
        placement = mapping.get(cleaned)
        if placement:
            placements.append(placement)

    if not placements:
        return None

    return min(placements, key=lambda placement: priority[placement])


def looks_like_email(value: Any) -> bool:
    if not isinstance(value, str):
        return False

    return bool(EMAIL_RE.match(value.strip()))


def field_text_value(field: dict[str, Any]) -> str | None:
    value = field.get("firstValue") or field.get("value")
    if value is None:
        return None

    cleaned = str(value).strip()
    return cleaned or None


def book_title(round_data: dict[str, Any]) -> str | None:
    for field in round_data.get("submissionFieldValues") or []:
        if field.get("alias") != BOOK_TITLE_ALIAS:
            continue

        return field_text_value(field)

    return None


def book_author(application: dict[str, Any], round_data: dict[str, Any]) -> str | None:
    if application.get("programId") != BOOK_AWARDS_PROGRAM_ID:
        return None

    for field in round_data.get("submissionFieldValues") or []:
        if field.get("alias") != BOOK_AUTHOR_ALIAS:
            continue

        return field_text_value(field)

    return None


def display_name(application: dict[str, Any], round_data: dict[str, Any]) -> str | None:
    name = application.get("name")
    if application.get("programId") != BOOK_AWARDS_PROGRAM_ID or not looks_like_email(name):
        return name

    return book_title(round_data) or name


def build_row(application: dict[str, Any], fetched_at_utc: str) -> dict[str, Any] | None:
    round_data = pick_round(application)
    if not round_data or not round_data.get("isWinner"):
        return None

    placement = normalize_placement(round_data.get("winnerTypes"))
    if not placement:
        return None

    return {
        "id": application.get("id"),
        "program_id": application.get("programId"),
        "user_id": application.get("userId"),
        "email": application.get("email"),
        "name": display_name(application, round_data),
        "author": book_author(application, round_data),
        "code": application.get("code"),
        "category_code": application.get("categoryCode"),
        "category_name": application.get("categoryName"),
        "category_path": application.get("categoryPath"),
        "placement": placement,
        "round_id": round_data.get("roundId"),
        "round_name": round_data.get("roundName"),
        "finalized_at_utc": round_data.get("finalizedAtUtc"),
        "updated_at_utc": round_data.get("updatedAtUtc"),
        "fetched_at_utc": fetched_at_utc,
    }


def create_table(conn: sqlite3.Connection) -> None:
    conn.execute(
        f"""
        CREATE TABLE IF NOT EXISTS {PLACED_TABLE} (
            id INTEGER PRIMARY KEY,
            program_id INTEGER NOT NULL,
            user_id INTEGER,
            email TEXT,
            name TEXT,
            author TEXT,
            code TEXT,
            category_code TEXT,
            category_name TEXT,
            category_path TEXT,
            placement TEXT NOT NULL,
            round_id INTEGER,
            round_name TEXT,
            finalized_at_utc TEXT,
            updated_at_utc TEXT,
            fetched_at_utc TEXT NOT NULL
        )
        """
    )


def ensure_column(conn: sqlite3.Connection, column_name: str, column_type: str) -> None:
    columns = {row[1] for row in conn.execute(f"PRAGMA table_info({PLACED_TABLE})")}
    if column_name in columns:
        return

    conn.execute(f"ALTER TABLE {PLACED_TABLE} ADD COLUMN {column_name} {column_type}")


def ensure_schema(conn: sqlite3.Connection) -> None:
    create_table(conn)
    ensure_column(conn, "author", "TEXT")


def upsert_row(conn: sqlite3.Connection, row: dict[str, Any]) -> None:
    conn.execute(
        f"""
        INSERT INTO {PLACED_TABLE} (
            id,
            program_id,
            user_id,
            email,
            name,
            author,
            code,
            category_code,
            category_name,
            category_path,
            placement,
            round_id,
            round_name,
            finalized_at_utc,
            updated_at_utc,
            fetched_at_utc
        ) VALUES (
            :id,
            :program_id,
            :user_id,
            :email,
            :name,
            :author,
            :code,
            :category_code,
            :category_name,
            :category_path,
            :placement,
            :round_id,
            :round_name,
            :finalized_at_utc,
            :updated_at_utc,
            :fetched_at_utc
        )
        ON CONFLICT(id) DO UPDATE SET
            program_id = excluded.program_id,
            user_id = excluded.user_id,
            email = excluded.email,
            name = excluded.name,
            author = excluded.author,
            code = excluded.code,
            category_code = excluded.category_code,
            category_name = excluded.category_name,
            category_path = excluded.category_path,
            placement = excluded.placement,
            round_id = excluded.round_id,
            round_name = excluded.round_name,
            finalized_at_utc = excluded.finalized_at_utc,
            updated_at_utc = excluded.updated_at_utc,
            fetched_at_utc = excluded.fetched_at_utc
        """,
        row,
    )


def ensure_parent_dir(db_path: Path) -> None:
    if db_path.parent == Path("."):
        return
    db_path.parent.mkdir(parents=True, exist_ok=True)


def unique_program_ids(program_ids: list[int]) -> list[int]:
    seen: set[int] = set()
    unique_ids: list[int] = []

    for program_id in program_ids:
        if program_id in seen:
            continue

        seen.add(program_id)
        unique_ids.append(program_id)

    return unique_ids


def main() -> int:
    args = parse_args()
    headers = load_environment()
    program_ids = unique_program_ids(args.program_id)

    if args.page_size <= 0:
        raise SystemExit("--page-size must be greater than 0")
    if args.max_pages is not None and args.max_pages <= 0:
        raise SystemExit("--max-pages must be greater than 0")

    db_path = Path(args.db)
    ensure_parent_dir(db_path)

    session = requests.Session()
    session.headers.update(headers)

    try:
        application_ids_by_program: dict[int, list[int]] = {}
        seen_application_ids: set[int] = set()
        application_ids: list[int] = []

        for program_id in program_ids:
            ids = iter_application_ids(session, program_id, args.page_size, args.max_pages)
            application_ids_by_program[program_id] = ids

            for application_id in ids:
                if application_id in seen_application_ids:
                    continue

                seen_application_ids.add(application_id)
                application_ids.append(application_id)
    except requests.HTTPError as exc:
        raise SystemExit(f"Failed to fetch application list: {exc}") from exc

    fetched_at_utc = datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")
    processed = 0
    placed = 0
    skipped = 0
    failed = 0

    with sqlite3.connect(db_path) as conn:
        ensure_schema(conn)

        for application_id in application_ids:
            processed += 1
            try:
                application = request_json(session, f"{API_BASE_URL}/Applications/{application_id}")
                row = build_row(application, fetched_at_utc)
                if row is None:
                    skipped += 1
                    if args.verbose:
                        round_data = pick_round(application)
                        if round_data and round_data.get("isWinner"):
                            print(f"{application_id}: winner with unrecognized placement {round_data.get('winnerTypes')}")
                        else:
                            print(f"{application_id}: not placed")
                    continue

                upsert_row(conn, row)
                placed += 1
                if args.verbose:
                    if row["name"] != application.get("name"):
                        print(f"{application_id}: placed ({row['placement']}), name replaced with book title")
                    else:
                        print(f"{application_id}: placed ({row['placement']})")
            except requests.HTTPError as exc:
                failed += 1
                print(f"{application_id}: request failed - {exc}", file=sys.stderr)
            except requests.RequestException as exc:
                failed += 1
                print(f"{application_id}: network error - {exc}", file=sys.stderr)
            except sqlite3.Error as exc:
                failed += 1
                print(f"{application_id}: database error - {exc}", file=sys.stderr)
            except Exception as exc:  # pragma: no cover - safety net
                failed += 1
                print(f"{application_id}: unexpected error - {exc}", file=sys.stderr)

        conn.commit()

    print(f"Programs: {', '.join(str(program_id) for program_id in program_ids)}")
    for program_id in program_ids:
        print(f"Program {program_id} applications discovered: {len(application_ids_by_program[program_id])}")
    print(f"Applications discovered (unique): {len(application_ids)}")
    print(f"Applications processed: {processed}")
    print(f"Placed rows written: {placed}")
    print(f"Skipped not placed: {skipped}")
    print(f"Failed: {failed}")
    print(f"SQLite database: {db_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
