@echo off
setlocal
cd /d "%~dp0"
echo ============================================================
echo  OpenWhispr 启动中
echo ============================================================
echo  [1/3] 加载 MSVC 环境（首次启动会编译原生模块）
call "C:\Program Files (x86)\Microsoft Visual Studio\2022\BuildTools\VC\Auxiliary\Build\vcvars64.bat" >nul 2>&1
if errorlevel 1 (
  echo  [warn] MSVC vcvars64.bat 未找到；如果 native 编译报错，请安装 VS 2022 Build Tools。
)

echo  [2/3] 同步 .env 并准备 whisper.cpp + ggml-base 模型
node scripts\bootstrap-windows.js
if errorlevel 1 (
  echo  [fail] bootstrap 失败，请把上面的报错贴出来。
  echo  按任意键关闭窗口...
  pause >nul
  exit /b %errorlevel%
)

echo  [3/3] 启动 Vite + Electron（首次会下载一些可选二进制，约 1-2 分钟）
echo         期间会看到 npm 编译 / 下载日志，保持此窗口开着。
echo         看到 OpenWhispr 主窗口弹出即可关闭此窗口（Electron 会保留在托盘）。
echo.
npm run dev