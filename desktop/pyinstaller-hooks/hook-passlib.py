# PyInstaller hook for passlib — forces all handler modules to be included
# because passlib uses dynamic registry lookup that PyInstaller can't trace.
from PyInstaller.utils.hooks import collect_submodules

hiddenimports = collect_submodules("passlib")
