@echo off
setlocal
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  echo Node.js를 찾을 수 없습니다.
  echo https://nodejs.org 에서 Node.js LTS를 설치한 뒤 다시 실행하세요.
  pause
  exit /b 1
)

where pnpm >nul 2>nul
if errorlevel 1 (
  echo pnpm을 찾을 수 없습니다. npm으로 실행합니다.
  npm run dev
) else (
  pnpm dev
)

pause
