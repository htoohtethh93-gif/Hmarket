@echo off
setlocal
cd /d "%~dp0"
where py >nul 2>nul
if %errorlevel%==0 (
  py -m http.server 5500
  goto :eof
)
where python >nul 2>nul
if %errorlevel%==0 (
  python -m http.server 5500
  goto :eof
)
echo Python was not found.
echo Install Python, or open this folder with VS Code Live Server.
pause
