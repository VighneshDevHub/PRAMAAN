"""
PRAMAAN Desktop Backend Launcher.
Starts the FastAPI backend on http://127.0.0.1:8000.
"""
import os
import sys

# ── Force passlib handlers into the bundle ────────────────────────────────────
# PyInstaller cannot trace passlib's dynamic registry — import all handlers
# explicitly so they are included in the frozen executable.
import passlib.handlers.bcrypt        # noqa: F401
import passlib.handlers.sha2_crypt    # noqa: F401
import passlib.handlers.des_crypt     # noqa: F401
import passlib.handlers.md5_crypt     # noqa: F401
import passlib.handlers.misc          # noqa: F401

# ── Resolve backend path ──────────────────────────────────────────────────────
if getattr(sys, "frozen", False):
    bundle_dir = getattr(sys, "_MEIPASS", os.path.dirname(sys.executable))
    if bundle_dir not in sys.path:
        sys.path.insert(0, bundle_dir)
else:
    _DESKTOP_DIR = os.path.dirname(os.path.abspath(__file__))
    _BACKEND_DIR = os.path.join(os.path.dirname(_DESKTOP_DIR), "backend")
    if _BACKEND_DIR not in sys.path:
        sys.path.insert(0, _BACKEND_DIR)

# ── Start uvicorn ─────────────────────────────────────────────────────────────
import uvicorn
from app.main import app

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8000, log_level="warning")
