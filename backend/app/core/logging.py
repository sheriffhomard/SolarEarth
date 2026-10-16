"""
Structured logging module for Solar Earth.
Allows distinguishing API, DATABASE, PVGIS, NASA, NOAA, EUMETSAT contexts.
"""

import json
import logging
import sys
from datetime import datetime, timezone
from typing import Any, Dict


class StructuredJsonFormatter(logging.Formatter):
    """
    JSON log formatter outputting timestamp, level, service, module, and message.
    """

    def __init__(self, service_name: str = "solar-earth-api"):
        super().__init__()
        self.service_name = service_name

    def format(self, record: logging.LogRecord) -> str:
        log_data: Dict[str, Any] = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "level": record.levelname,
            "service": self.service_name,
            "module": getattr(record, "subsystem", record.name),
            "message": record.getMessage(),
        }

        if record.exc_info:
            log_data["exception"] = self.formatException(record.exc_info)

        if hasattr(record, "extra_data") and isinstance(record.extra_data, dict):
            log_data.update(record.extra_data)

        return json.dumps(log_data)


def setup_logging(level: str = "INFO") -> None:
    """Configures the root logger with the structured JSON formatter."""
    root_logger = logging.getLogger()
    root_logger.setLevel(getattr(logging, level.upper(), logging.INFO))

    # Remove existing handlers to avoid duplicates
    for handler in list(root_logger.handlers):
        root_logger.removeHandler(handler)

    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(StructuredJsonFormatter())
    root_logger.addHandler(handler)


def get_logger(module_name: str) -> logging.LoggerAdapter:
    """
    Returns a logger adapter tagging subsystem module (e.g. API, DATABASE, PVGIS, NASA, NOAA, EUMETSAT).
    """
    base_logger = logging.getLogger(f"solar_earth.{module_name.lower()}")
    return logging.LoggerAdapter(base_logger, {"subsystem": module_name.upper()})
