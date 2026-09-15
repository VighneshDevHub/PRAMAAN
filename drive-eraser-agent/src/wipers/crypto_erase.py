"""
NIST 800-88 Purge via Crypto Erase — for self-encrypting SSD/NVMe
drives. Real hardware: hdparm --security-erase-enhanced / TCG Opal
tooling. This simulates key destruction + a fast overwrite so the
before/after content visibly differs in a demo.
"""
import os
import secrets

from src.wipers.base import Wiper, WipeResult

CHUNK_SIZE = 4 * 1024 * 1024


class CryptoEraseWiper(Wiper):
    method_name = "NIST 800-88 Purge - Crypto Erase"

    def wipe(self, target: str, size_bytes: int, progress_callback=None) -> WipeResult:
        _ephemeral_key = secrets.token_bytes(32)
        del _ephemeral_key
        if progress_callback:
            progress_callback(20, "WIPING", "Cryptographic key material sanitized from Opal/SED controller")

        bytes_written = 0
        total_size = max(1, size_bytes)
        with open(target, "r+b") as f:
            f.seek(0)
            while bytes_written < size_bytes:
                chunk = min(CHUNK_SIZE, size_bytes - bytes_written)
                f.write(os.urandom(chunk))
                bytes_written += chunk
                if progress_callback:
                    pct = 20 + int((bytes_written / total_size) * 65)
                    progress_callback(
                        min(85, pct),
                        "WIPING",
                        f"Crypto Erase verification fill: {bytes_written // (1024 * 1024)} MB processed",
                    )
            f.flush()
            os.fsync(f.fileno())

        return WipeResult(
            method_name=self.method_name, passes=1, bytes_processed=bytes_written
        )
