@echo off
setlocal
cd /d "%~dp0"
REM Source MSVC environment (needed for node-gyp build steps).
call "C:\Program Files (x86)\Microsoft Visual Studio\2022\BuildTools\VC\Auxiliary\Build\vcvars64.bat" >nul 2>&1
if errorlevel 1 (
  echo [warn] MSVC vcvars64.bat not found at default path; continuing anyway.
  echo [warn] Native C++ compile steps will fail. Install VS 2022 Build Tools if needed.
)
REM First-run one-shot: sync .env, download whisper.cpp + ggml-base model.
node scripts\bootstrap-windows.js
if errorlevel 1 exit /b %errorlevel%
REM Start the dev server (Vite renderer + Electron main).
npm run dev