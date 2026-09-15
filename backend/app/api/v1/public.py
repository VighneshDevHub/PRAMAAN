from pathlib import Path
import os

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db
from app.services import analytics_service

router = APIRouter(prefix="/public", tags=["public"])

_REPO_ROOT = Path(__file__).resolve().parents[4]


@router.get("/stats")
async def get_public_stats(
    db: AsyncSession = Depends(get_db),
) -> dict:
    return await analytics_service.get_public_stats(db)


@router.get("/download-desktop")
async def download_desktop_app():
    """Public endpoint to download the PRAMAAN Desktop Application installer."""
    possible_paths = [
        _REPO_ROOT / "desktop" / "src-tauri" / "target" / "release" / "bundle" / "nsis" / "PRAMAAN_0.1.0_x64-setup.exe",
        _REPO_ROOT / "desktop" / "src-tauri" / "target" / "release" / "bundle" / "msi" / "PRAMAAN_0.1.0_x64_en-US.msi",
        _REPO_ROOT / "desktop" / "dist" / "PRAMAAN_Desktop_Setup.exe",
        _REPO_ROOT / "dist" / "pramaan-backend" / "pramaan-backend.exe",
        _REPO_ROOT / "frontend" / "public" / "downloads" / "PRAMAAN_Desktop_Setup.exe",
    ]
    for target in possible_paths:
        if target.exists():
            filename = target.name if target.suffix in [".exe", ".msi"] else "PRAMAAN_Desktop_Setup.exe"
            return FileResponse(
                path=str(target),
                filename=filename,
                media_type="application/octet-stream",
            )
    raise HTTPException(
        status_code=404,
        detail="PRAMAAN Desktop App package is currently building. Please run desktop/build-production.bat to generate installer.",
    )
