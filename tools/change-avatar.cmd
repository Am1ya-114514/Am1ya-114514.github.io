@echo off
rem ─────────────────────────────────────────────────────────────
rem  阿巴怪的实验室 · 一键换头像
rem  双击本文件即可：选一张图 → 自动裁成正方形 → 提交并推送
rem  详细说明见仓库根目录的 README.md
rem ─────────────────────────────────────────────────────────────
chcp 65001 >nul
setlocal
cd /d "%~dp0.."

set "NODE="
for %%C in (node.exe) do if not defined NODE set "NODE=%%~$PATH:C"
if not defined NODE if exist "F:\dev\nodejs\node.exe" set "NODE=F:\dev\nodejs\node.exe"
if not defined NODE if exist "%ProgramFiles%\nodejs\node.exe" set "NODE=%ProgramFiles%\nodejs\node.exe"
if not defined NODE if exist "%ProgramFiles(x86)%\nodejs\node.exe" set "NODE=%ProgramFiles(x86)%\nodejs\node.exe"
if not defined NODE if exist "%LocalAppData%\Programs\nodejs\node.exe" set "NODE=%LocalAppData%\Programs\nodejs\node.exe"

if not defined NODE (
  echo.
  echo   [x] 找不到 Node.js。
  echo       请先安装 Node.js 22 或更高版本，然后重新双击本文件。
  echo.
  pause
  exit /b 1
)

if not exist "node_modules\sharp\package.json" (
  echo.
  echo   [x] 还没有安装依赖（缺少 sharp）。
  echo       请在本文件夹打开终端，先执行：
  echo.
  echo           npm install
  echo.
  pause
  exit /b 1
)

echo.
echo   使用 Node: %NODE%
echo.

"%NODE%" "tools\change-avatar.mjs"
set "RC=%ERRORLEVEL%"

echo.
pause
exit /b %RC%
