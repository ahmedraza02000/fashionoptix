"""Real authentication: salted PBKDF2 password hashing + random session
tokens, using only the Python standard library (hashlib, secrets) so there
is nothing to pip install. Good enough for an FYP prototype; a production
system would add rate limiting, email verification, HTTPS-only cookies,
and token expiry/refresh."""

import hashlib
import secrets

ITERATIONS = 200_000


def hash_password(password: str, salt: str = None):
    salt = salt or secrets.token_hex(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode(), salt.encode(), ITERATIONS).hex()
    return salt, digest


def verify_password(password: str, salt: str, expected_digest: str) -> bool:
    _, digest = hash_password(password, salt)
    return secrets.compare_digest(digest, expected_digest)


def new_token() -> str:
    return secrets.token_hex(32)
