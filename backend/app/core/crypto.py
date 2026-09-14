"""
Cryptographic signing service — the trust root shared by all three
ForensicGuard modules (drive eraser, file/folder eraser, recovery). Every
operation record, regardless of which module produced it, is signed the
same way and can be verified the same way. This is deliberate: a
recovery report needs exactly the same tamper-evidence guarantee as an
erasure certificate — "this record has not been altered since issued."

Design notes:
- We sign the SHA-256 hash of the *canonical* JSON representation of an
  operation record (sorted keys, no whitespace) so verification is
  deterministic regardless of upstream JSON formatting.
- In production, SIGNING_PRIVATE_KEY_PEM must be injected via a secrets
  manager and rotated periodically. Never log or return the private key.
"""
import hashlib
import json
import os
from pathlib import Path
from typing import Any

from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import ec
from cryptography.exceptions import InvalidSignature

from app.core.config import get_settings

settings = get_settings()


def generate_keypair() -> tuple[str, str]:
    """Generate a new ECDSA (P-256) keypair. Returns (private_pem, public_pem)."""
    private_key = ec.generate_private_key(ec.SECP256R1())
    private_pem = private_key.private_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PrivateFormat.PKCS8,
        encryption_algorithm=serialization.NoEncryption(),
    ).decode()
    public_pem = private_key.public_key().public_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PublicFormat.SubjectPublicKeyInfo,
    ).decode()
    return private_pem, public_pem


def canonical_json(data: dict[str, Any]) -> bytes:
    """Deterministic JSON encoding: sorted keys, no extra whitespace."""
    return json.dumps(data, sort_keys=True, separators=(",", ":")).encode("utf-8")


def sha256_hex(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def sign_payload(data: dict[str, Any], private_key_pem: str) -> tuple[str, str]:
    """Sign a dict payload. Returns (payload_hash_hex, signature_hex)."""
    private_key = serialization.load_pem_private_key(
        private_key_pem.encode(), password=None
    )
    payload_bytes = canonical_json(data)
    payload_hash_hex = sha256_hex(payload_bytes)
    signature = private_key.sign(payload_bytes, ec.ECDSA(hashes.SHA256()))
    return payload_hash_hex, signature.hex()


def verify_signature(
    data: dict[str, Any], signature_hex: str, public_key_pem: str
) -> bool:
    """Re-derive canonical bytes from `data` and check the signature.
    Returns False (never raises) on any mismatch."""
    try:
        public_key = serialization.load_pem_public_key(public_key_pem.encode())
        payload_bytes = canonical_json(data)
        signature = bytes.fromhex(signature_hex)
        public_key.verify(signature, payload_bytes, ec.ECDSA(hashes.SHA256()))
        return True
    except (InvalidSignature, ValueError, TypeError):
        return False


DEFAULT_DEV_PRIVATE_PEM = (
    "-----BEGIN PRIVATE KEY-----\n"
    "MIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQgkDy0fmiFpbkjF+/s\n"
    "xEU6fozvEV68jwkrYKZ46+4XVaehRANCAAQR/EbPkVHy3vEtCdQZ85R+Y0Vr25WQ\n"
    "a6AlqWeg6OzrN9SVKlQ4ozZrXN++SwKxymLQgViHhgQjaBh1ICcMF1az\n"
    "-----END PRIVATE KEY-----\n"
)
DEFAULT_DEV_PUBLIC_PEM = (
    "-----BEGIN PUBLIC KEY-----\n"
    "MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEEfxGz5FR8t7xLQnUGfOUfmNFa9uV\n"
    "kGugJalnoOjs6zfUlSpUOKM2a1zfvksCscpi0IFYh4YEI2gYdSAnDBdWsw==\n"
    "-----END PUBLIC KEY-----\n"
)


def get_or_create_dev_keypair() -> tuple[str, str]:
    """Persistent keypair resolution, in priority order:

    1. Explicit env vars (SIGNING_PRIVATE_KEY_PEM/SIGNING_PUBLIC_KEY_PEM)
       — always wins, this is the production path (secrets manager
       injects these).
    2. A local keys/ directory next to the backend, if present from a
       previous run.
    3. Default seed keypair that matches pre-seeded database operation records.
    """
    if settings.SIGNING_PRIVATE_KEY_PEM and settings.SIGNING_PUBLIC_KEY_PEM:
        return settings.SIGNING_PRIVATE_KEY_PEM, settings.SIGNING_PUBLIC_KEY_PEM

    keys_dir = Path(__file__).resolve().parent.parent.parent / "keys"
    private_key_path = keys_dir / "private.pem"
    public_key_path = keys_dir / "public.pem"

    if private_key_path.exists() and public_key_path.exists():
        return private_key_path.read_text(), public_key_path.read_text()

    try:
        keys_dir.mkdir(parents=True, exist_ok=True)
        private_key_path.write_text(DEFAULT_DEV_PRIVATE_PEM)
        public_key_path.write_text(DEFAULT_DEV_PUBLIC_PEM)
        try:
            os.chmod(private_key_path, 0o600)
        except OSError:
            pass
    except Exception:
        pass

    return DEFAULT_DEV_PRIVATE_PEM, DEFAULT_DEV_PUBLIC_PEM
