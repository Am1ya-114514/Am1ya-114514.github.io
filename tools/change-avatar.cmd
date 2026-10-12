@echo off
rem ---------------------------------------------------------------------------
rem  Am1ya Lab - one-click avatar swap
rem
rem  Double-click this file: pick an image, it gets squared into
rem  profile.webp / profile.jpg, then committed and pushed. Full manual and
rem  every option are documented in README.md.
rem
rem  This file is deliberately ASCII-only with CRLF line endings. cmd.exe reads
rem  batch files byte-by-byte in the console codepage, so putting Chinese text
rem  here (or saving it with bare LF endings) makes every line mis-parse.
rem  All Chinese output comes from tools\change-avatar.mjs instead.
rem ---------------------------------------------------------------------------
setlocal
cd /d "%~dp0.."
chcp 65001 >nul

set "NODE="
for %%C in (node.exe) do if not defined NODE set "NODE=%%~$PATH:C"
if not defined NODE if exist "F:\dev\nodejs\node.exe" set "NODE=F:\dev\nodejs\node.exe"
if not defined NODE if exist "%ProgramFiles%\nodejs\node.exe" set "NODE=%ProgramFiles%\nodejs\node.exe"
if not defined NODE if exist "%ProgramFiles(x86)%\nodejs\node.exe" set "NODE=%ProgramFiles(x86)%\nodejs\node.exe"
if not defined NODE if exist "%LocalAppData%\Programs\nodejs\node.exe" set "NODE=%LocalAppData%\Programs\nodejs\node.exe"

if not defined NODE (
  echo.
  echo   [x] Node.js was not found.
  echo       Install Node.js 22 or newer, then double-click this file again.
  echo.
  pause
  exit /b 1
)

"%NODE%" "tools\change-avatar.mjs" %*
set "RC=%ERRORLEVEL%"

echo.
pause
exit /b %RC%
