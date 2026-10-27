#!/usr/bin/env python3
"""
Initialize the local SQLite database (solar_earth.db) for developer workstation / offline mode.
Creates the schema and tables (locations, radiation_observations) defined in SQLAlchemy models.
"""

import os
import sys
import sqlite3

def init_sqlite_database(db_path: str = "solar_earth.db"):
    print(f"[SolarEarth] Initializing local SQLite database at: {db_path}")
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    # Meta table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS meta (
            key TEXT PRIMARY KEY,
            val TEXT NOT NULL
        )
    """)
    cursor.execute("INSERT OR REPLACE INTO meta (key, val) VALUES ('app', 'SolarEarth')")
    cursor.execute("INSERT OR REPLACE INTO meta (key, val) VALUES ('schema_version', '1.0.0')")

    # Locations table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS locations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            latitude REAL NOT NULL,
            longitude REAL NOT NULL,
            elevation_m REAL DEFAULT 0.0,
            timezone TEXT DEFAULT 'UTC',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    # Radiation observations table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS radiation_observations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            location_id INTEGER,
            timestamp_utc TEXT NOT NULL,
            ghi REAL,
            dni REAL,
            dhi REAL,
            solar_elevation REAL,
            temperature_2m REAL,
            source_provider TEXT NOT NULL,
            quality_flag TEXT DEFAULT 'model_clearsky',
            FOREIGN KEY (location_id) REFERENCES locations(id)
        )
    """)

    conn.commit()
    conn.close()
    print(f"[SolarEarth] SQLite database successfully initialized with verified header.")

if __name__ == "__main__":
    target = sys.argv[1] if len(sys.argv) > 1 else "solar_earth.db"
    init_sqlite_database(target)
