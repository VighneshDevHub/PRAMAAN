# -*- mode: python ; coding: utf-8 -*-


a = Analysis(
    ['C:/Users/vighn/Desktop/STAY-HARD/SIH 2026/PRAMAAN/desktop/desktop_launcher.py'],
    pathex=['C:/Users/vighn/Desktop/STAY-HARD/SIH 2026/PRAMAAN/desktop/../backend'],
    binaries=[],
    datas=[],
    hiddenimports=['passlib.handlers.bcrypt', 'passlib.handlers.sha2_crypt', 'passlib.handlers.des_crypt', 'aiosqlite', 'asyncpg', 'sqlalchemy.dialects.sqlite', 'sqlalchemy.dialects.postgresql'],
    hookspath=['C:/Users/vighn/Desktop/STAY-HARD/SIH 2026/PRAMAAN/desktop/pyinstaller-hooks'],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[],
    noarchive=False,
    optimize=0,
)
pyz = PYZ(a.pure)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.datas,
    [],
    name='pramaan-backend',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    upx_exclude=[],
    runtime_tmpdir=None,
    console=True,
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
)
