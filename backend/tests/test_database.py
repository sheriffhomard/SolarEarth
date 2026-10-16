"""
Tests for Database session, connection checking, and mock fallback.
"""

from unittest.mock import MagicMock, patch
from backend.app.database.session import check_db_connection


def test_check_db_connection_success():
    with patch("backend.app.database.session.engine.connect") as mock_connect:
        mock_conn = MagicMock()
        mock_connect.return_value.__enter__.return_value = mock_conn
        assert check_db_connection() is True


def test_check_db_connection_failure():
    with patch("backend.app.database.session.engine.connect", side_effect=Exception("Connection refused")):
        assert check_db_connection() is False
