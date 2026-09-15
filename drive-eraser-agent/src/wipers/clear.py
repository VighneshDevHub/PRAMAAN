import os

from src.wipers.base import Wiper, WipeResult

CHUNK_SIZE = 1024 * 1024


class ClearWiper(Wiper):
    method_name = "NIST 800-88 Clear (single-pass overwrite)"

    def wipe(self, target: str, size_bytes: int, progress_callback=None) -> WipeResult:
        bytes_written = 0
        total_size = max(1, size_bytes)
        with open(target, "r+b") as f:
            f.seek(0)
            while bytes_written < size_bytes:
                chunk = min(CHUNK_SIZE, size_bytes - bytes_written)
                f.write(os.urandom(chunk))
                bytes_written += chunk
                if progress_callback:
                    pct = 15 + int((bytes_written / total_size) * 70)
                    mb = bytes_written // (1024 * 1024)
                    progress_callback(
                        min(85, pct),
                        "WIPING",
                        f"NIST 800-88 Clear: {mb} MB overwritten",
                    )
            f.flush()
            os.fsync(f.fileno())

        return WipeResult(
            method_name=self.method_name, passes=1, bytes_processed=bytes_written
        )
