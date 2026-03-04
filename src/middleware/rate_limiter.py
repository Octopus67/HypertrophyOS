"""Simple in-memory rate limiter for login attempts."""

import time

from src.config.settings import settings
from src.shared.errors import RateLimitedError

# In-memory store: email -> list of attempt timestamps
_login_attempts: dict[str, list[float]] = {}

MAX_ENTRIES = 10000  # Prevent unbounded memory growth


def _cleanup_old_entries() -> None:
    """Remove entries older than the rate limit window from ALL keys."""
    cutoff = time.time() - settings.LOGIN_RATE_LIMIT_WINDOW_SECONDS
    keys_to_delete = []
    
    for email, attempts in _login_attempts.items():
        _login_attempts[email] = [t for t in attempts if t > cutoff]
        if not _login_attempts[email]:
            keys_to_delete.append(email)
    
    for email in keys_to_delete:
        del _login_attempts[email]
    
    # If still too many entries, remove oldest
    if len(_login_attempts) > MAX_ENTRIES:
        sorted_emails = sorted(_login_attempts.keys(), 
                             key=lambda e: min(_login_attempts[e]) if _login_attempts[e] else 0)
        for email in sorted_emails[:len(_login_attempts) - MAX_ENTRIES]:
            del _login_attempts[email]


def _prune_old_attempts(email: str) -> None:
    """Remove attempts older than the rate limit window."""
    if email not in _login_attempts:
        return
    cutoff = time.time() - settings.LOGIN_RATE_LIMIT_WINDOW_SECONDS
    _login_attempts[email] = [t for t in _login_attempts[email] if t > cutoff]
    if not _login_attempts[email]:
        del _login_attempts[email]


def check_rate_limit(email: str) -> None:
    """Check if the email has exceeded the login rate limit.

    Raises RateLimitedError if attempts exceed the configured threshold
    within the rate limit window (default 15 minutes).
    """
    _cleanup_old_entries()  # Periodic cleanup
    _prune_old_attempts(email)
    attempts = _login_attempts.get(email, [])
    if len(attempts) >= settings.LOGIN_RATE_LIMIT_THRESHOLD:
        raise RateLimitedError(
            message="Too many login attempts. Please try again later.",
            retry_after=settings.LOGIN_RATE_LIMIT_WINDOW_SECONDS,
        )


def record_attempt(email: str) -> None:
    """Record a failed login attempt for the given email."""
    if email not in _login_attempts:
        _login_attempts[email] = []
    _login_attempts[email].append(time.time())


def reset_attempts(email: str) -> None:
    """Clear login attempts for an email (e.g. after successful login)."""
    _login_attempts.pop(email, None)


def clear_all() -> None:
    """Clear all rate limit state. Useful for testing."""
    _login_attempts.clear()
