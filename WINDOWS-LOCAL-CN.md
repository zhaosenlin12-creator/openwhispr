# OpenWhispr Windows 本地运行手册

本仓库 fork 自 [OpenWhispr/openwhispr](https://github.com/OpenWhispr/openwhispr)，在上面做了 **Windows + 国内网络** 场景下的可用性修补。这份文档只讲怎么把这套东西在本机跑起来，按章节看即可，不必从头到尾读。

## 这个分支改了什么

相对上游 main，我们调整了下面这些点，每一项都对应一个真实踩过的坑：

1. **国内网络访问 HF 模型**：把所有 `huggingface.co` 替换为 `hf-mirror.com`，避免 `download:embedding-model` / `download:whisper-vad-model` 等脚本在 `npm run dev` 阶段拉模型时直接失败。
2. **`predev:main` 兜底**：上游的 predev:main 链里有几个 `download:*` 步骤会因网络问题硬挂，我们在 `package.json` 里给非关键步骤加了 `|| true`。
3. **whisper.cpp 二进制**：上游只在 `prebuild` 时下载 whisper-server，`predev` 不下。本地脚本 `scripts/bootstrap-windows.js` 弥补了这个缺口。
4. **本地 Whisper 模型**：把 `ggml-base.bin` (~142 MB) 的下载入口加进 bootstrap，避免首次启动还要去设置里手点下载。
5. **`.env` 默认本地化**：项目根 `.env` 默认走本地 Whisper（`LOCAL_TRANSCRIPTION_PROVIDER=whisper` / `LOCAL_WHISPER_MODEL=base`），并把热键改成 `F8`（**不要用 Ctrl+Alt+Space，跟微信语音冲突**）。
6. **`%APPDATA%` 的 .env 同步**：新增 `scripts/bootstrap-windows.js`，每次启动时把项目 `.env` 里非空键同步到 `%APPDATA%\OpenWhispr-development\.env`，避免两份配置打架。
7. **环境变量覆盖逻辑保留**：上游 `src/config/constants.ts` 里 `process.env` 优先于 `import.meta.env`，所以根 `.env` 修改会立即生效。

> 上游代码本身改动很小（~100 行），主要是下载脚本 + 一处 `transcriptionRoute.ts` 的兜底 + vite define；见 `git log` 自行对比。

---

## 一键启动（Windows）

环境装好后，**直接双击项目根目录下的 `start.bat`**，它会：

1. 加载 MSVC 环境（让 native C++ 编译能找到 `cl.exe`）
2. 调用 `scripts/bootstrap-windows.js` 把 `.env` 同步到 `%APPDATA%` 并下载 whisper 二进制 + ggml-base 模型
3. 启动 `npm run dev`（Vite + Electron）

**停止**：双击 `stop.bat`，会强制杀掉 openwhispr 关联的所有 electron/node 进程。

如果你没有 `vcvars64.bat`，请先安装 [Visual Studio 2022 Build Tools](https://aka.ms/vs/17/release/vs_BuildTools.exe)，选"**使用 C++ 的桌面开发**"工作负载。

---

## 环境要求

| 项 | 要求 | 备注 |
| --- | --- | --- |
| 操作系统 | Windows 10/11 x64 | macOS / Linux 也支持，但本手册只覆盖 Windows |
| Node.js | **24.x** 或更高 | 在 [nodejs.org](https://nodejs.org) 下 LTS 即可 |
| MSVC | VS 2022 Build Tools + "使用 C++ 的桌面开发" | 用于 node-gyp 构建原生模块 |
| 磁盘空间 | 至少 3 GB | 模型 + node_modules + Electron 缓存 |
| 网络 | 能访问 `hf-mirror.com` | 国内用户强推 |
| 麦克风 | 任意可用麦克风 | 默认系统麦克风 |
| GPU | 可选 | 有 NVIDIA/AMD 卡可以在设置里开 CUDA/Vulkan 加速 |

---

## 安装步骤（从头来过）

```powershell
# 1. 克隆仓库
git clone https://github.com/<你的仓库>/openwhispr.git
cd openwhispr

# 2. 安装依赖
npm install

# 3. 启动（首次会触发 bootstrap-windows.js，下载模型约 1 分钟）
start.bat
```

启动成功后会看到：

- 主窗口弹出（OpenWhispr 控制面板）
- 任务栏右下角托盘出现图标
- 系统通知"OpenWhispr started"

**首次进应用时**：

- 主窗口会进入 onboarding 流程
- 在 "Try your first dictation" 这一页，**用任意输入框（比如记事本）按 F8 录一段**——它会把识别结果粘贴到你当前的焦点窗口
- 然后一路点 Continue 走完 onboarding（这个仓库已经把 onboarding 标记为完成，你看到的就是主面板）

---

## 日常使用

| 动作 | 按键 / 操作 |
| --- | --- |
| 开始 / 停止录音 | **F8**（按一下切换，push-to-talk 模式） |
| 最小化到托盘 | 主窗口点 `-`（**不要点 X**，否则进程被杀） |
| 完全退出 | 双击桌面 `stop.bat`，或在托盘右键菜单里选 Exit |

按下 F8 → 说话 → 再按 F8 → 识别完成的文字通过 `Ctrl+V` 粘贴到 **当前焦点窗口**（微信 / 浏览器 / 记事本 / VS Code / Word …都可以）。**当前焦点窗口**=光标所在的那个输入框，OpenWhispr 不关心是哪个程序。

---

## 配置文件

### 项目根 `.env`（会被 .gitignore，不会提交）

默认值已经走本地 Whisper，开箱即用：

```ini
LOCAL_TRANSCRIPTION_PROVIDER=whisper
LOCAL_WHISPER_MODEL=base
DICTATION_LANGUAGE=zh-CN
DICTATION_KEY=F8
ACTIVATION_MODE=push
UI_LANGUAGE=en
OPENWHISPR_LOG_LEVEL=debug
```

切换热键：改 `DICTATION_KEY=`，例如改成 `F9`、`Ctrl+Shift+D` 都可以。
切换模型：把 `LOCAL_WHISPER_MODEL=` 改成 `tiny` / `base` / `small` / `medium` / `large` / `turbo`（首次切换需要等模型下载完）。
切换语言：把 `DICTATION_LANGUAGE=` 改成 `en`、`zh`、`ja` 等，空字符串表示自动检测。

### 用户数据目录 `%APPDATA%\OpenWhispr-development\`

- `.env`：运行时配置，bootstrap-windows.js 会把项目 `.env` 的非空键同步到这里
- `Local Storage\leveldb\`：UI 设置（你点过哪些按钮、当前激活的 provider 等）。**不要在 app 运行时改这里**，会被覆盖
- `logs\debug-*.log`：调试日志，最新的文件总是最大的那个

---

## 踩过的坑（必看）

下面这些都是 **真实遇到过的** 失败原因，按概率排序：

### 1. Control+Alt+Space 被微信语音抢走

**症状**：按了快捷键没反应，微信弹出语音输入框。

**原因**：Windows 上微信的语音消息快捷键就是 `Ctrl+Alt+Space`。OpenWhispr 和微信两个进程都注册了同一个全局热键，Windows 把事件优先给了已经常驻的微信。

**解法**：换热键。**强烈推荐 `F8` 或 `F9`**，不要用 `Ctrl+Alt+Space` / `Ctrl+Shift+Space`。

### 2. `npm install` 时 electron 下载卡死

**症状**：`postinstall` 阶段停在 `downloading electron-vXX.X.X-win32-x64.zip: XX%`，永远下不完。

**原因**：electron 的下载源在 `npmmirror.com` / `registry.npmmirror.com`，高峰期不稳定。

**解法**：项目里已经手动放好了 `node_modules\electron\dist\electron.exe` + `node_modules\electron\path.txt`，`npm install` 会跳过下载。如果你 clone 一份全新的需要重做这步：

```powershell
# 直接走 GitHub release（速度可能也不稳，挂了多试几次）
$env:ELECTRON_MIRROR = "https://npmmirror.com/mirrors/electron/"
npm install
```

### 3. `huggingface.co` 在国内打不开

**症状**：`download:embedding-model` 报 `getaddrinfo ENOTFOUND huggingface.co`，整个 dev 启动失败。

**原因**：HF 主站在国内经常被墙。

**解法**：仓库已把 `huggingface.co` 全部换成 `hf-mirror.com`。如果你切换到自定义模型，需要在 `scripts/download-*.js` 里也用镜像。

### 4. `npm run dev` 跑到 `compile:mic-listener` 时 MSVC 找不到

**症状**：`error MSB8036: 找不到 Windows SDK` 或 `cl.exe` 报 not found。

**原因**：node-gyp 需要 MSVC 编译器，但 `cl.exe` 默认不在 PATH 里。

**解法**：用仓库里的 `start.bat`，它会先 `call vcvars64.bat`。如果你不用 start.bat，开 dev 前手动执行：

```cmd
call "C:\Program Files (x86)\Microsoft Visual Studio\2022\BuildTools\VC\Auxiliary\Build\vcvars64.bat"
```

VS Build Tools 默认装在这个路径，**如果不是**，自行修改 `start.bat` 第一行。

### 5. `whisper-server-win32-x64.exe` 找不到

**症状**：主进程启动时报 `whisper-server binary not found`。

**原因**：`predev:main` 不下载这个二进制（只有 `prebuild` 下），所以 dev 模式启动后本地识别跑不起来。

**解法**：`start.bat` 会调 `scripts/bootstrap-windows.js`，里面会自动跑 `download-whisper-cpp.js --current`。如果你手动跑 `npm run dev` 而没用 start.bat，请单独执行：

```powershell
node scripts/download-whisper-cpp.js --current
```

### 6. 改了 `.env` 不生效

**症状**：改了 `LOCAL_TRANSCRIPTION_PROVIDER=...`，重启后还是原来的。

**原因**：Electron 主进程启动时把项目 `.env` 同步到 `%APPDATA%\OpenWhispr-development\.env`，**后者优先级更高**。直接改项目 `.env` 不够，还要同步过去。

**解法**：

```powershell
# 停掉 app
stop.bat
# 重新启动（会自动同步）
start.bat
```

或者直接手动编辑 `%APPDATA%\OpenWhispr-development\.env`。

### 7. 启动时报 `401 login fail`（如果配置了云端 API）

**症状**：日志里出现 `error: login fail: Please carry the API secret key in the 'Authorization' field`，识别请求被服务端拒。

**原因**：上游默认走 OpenAI 官方端点；如果你切到了 MiniMax / 自托管兼容端点，需要在 `.env` 里同时设置 `OPENAI_BASE_URL` 和 `OPENWHISPR_TRANSCRIPTION_BASE_URL`（不只是 `OPENAI_API_KEY`）。

**解法**：本仓库默认走本地 Whisper，**不会触发这个错误**。如果你坚持要走云端，把下面四个变量同时配齐：

```ini
OPENAI_API_KEY=...
OPENAI_BASE_URL=https://api.example.com/v1
OPENWHISPR_OPENAI_BASE_URL=https://api.example.com/v1
OPENWHISPR_TRANSCRIPTION_BASE_URL=https://api.example.com/v1
WHISPER_BASE_URL=https://api.example.com/v1
```

### 8. 改了 LevelDB 但没生效

**症状**：手动编辑 `%APPDATA%\OpenWhispr-development\Local Storage\leveldb\*.log`，重启后还是原来的设置。

**原因**：LevelDB 文件在 app 持有文件锁时写入无效。

**解法**：**先 stop.bat 再改文件**。改完后 start.bat。

### 9. Vite 启动后页面显示 `__MINIMAX_URL__ is not defined`

**症状**：浏览器控制台报变量未定义。

**原因**：Vite 8 的 `define` 配置在某些情况下不会替换 renderer 里的字面量。

**解法**：本仓库通过在 `src/config/constants.ts` 里硬编码 fallback 解决（默认指向本地 Whisper）。这条不会再触发。

---

## 模型选择

| 模型 | 大小 | 中文 | 速度 | 适用场景 |
| --- | --- | --- | --- | --- |
| Whisper ggml-tiny | 75 MB | 弱 | 极快 | 英文短指令 |
| **Whisper ggml-base** | **142 MB** | **✅** | **快** | **默认推荐**，中文/英文日常 |
| Whisper ggml-small | 466 MB | ✅ | 中等 | 更高准确率，需要等下载 |
| Whisper ggml-medium | 1.5 GB | ✅ | 慢 | 高质量长录音 |
| Orukeet v0.1.0 | 671 MB | ❌ | 快 | **欧洲语言**，不支持中文 |
| Cohere Transcribe | 1.7 GB | ✅ | 慢 | 14 语种多语言 |

切换模型：改 `.env` 的 `LOCAL_WHISPER_MODEL=`，重启后会自动下载。

---

## 调试

**日志位置**：`%APPDATA%\OpenWhispr-development\logs\debug-<timestamp>.log`，按 LastWriteTime 倒序找最新的。

**录制但没识别**：搜 `Recording stopped`，看后面有没有 `whisper-server transcription completed`。如果没有，说明录音正常但没识别成功，看 [踩坑 #5]。

**完全没按热键响应**：搜 `KEY_DOWN` / `KEY_UP`，看有没有事件。如果完全没有，看 [踩坑 #1]。

**粘贴不生效**：搜 `fast-paste` / `pasteMs`，看 windows-fast-paste.exe 有没有输出 `PASTE_OK <窗口名> ctrl+v`。如果输出的是 `PASTE_OK Progman`（桌面）而不是你的目标窗口，说明焦点不在目标输入框。

**主窗口吸焦点**：如果你点主窗口后无法切到其他程序，点主窗口的 `-` 把它最小化即可，托盘进程还在跑、F8 全局仍然响应。

---

## 卸载 / 重置

```powershell
# 1. 停掉进程
stop.bat

# 2. 删用户数据（设置 / 日志 / 模型）
Remove-Item -Recurse "$env:APPDATA\OpenWhispr-development"

# 3. 删模型缓存
Remove-Item -Recurse "$env:USERPROFILE\.cache\openwhispr"

# 4. 卸载 node_modules 重装
Remove-Item -Recurse node_modules
npm install
```

---

## 进阶：构建正式安装包

```powershell
npm run build:win
```

产出在 `dist\` 下，分两种：

- `dist\OpenWhispr Setup 1.10.2.exe` —— 可安装到系统的 installer
- `dist\win-unpacked\OpenWhispr.exe` —— 绿色版，双击直接跑

构建过程会：

1. 跑所有 `download:*` 脚本拿齐二进制
2. 调用 `electron-builder --win` 打 exe

> ⚠️ 构建用 `unsigned` 配置（`electron-builder.unsigned-win.json`），所以生成的 exe 没数字签名，Windows SmartScreen 会弹警告，点"仍要运行"即可。

---

## 许可

代码部分继承上游 [OpenWhispr](https://github.com/OpenWhispr/openwhispr) 的许可（见 LICENSE）。本仓库新增的脚本（`scripts/bootstrap-windows.js`、`start.bat`、`stop.bat`）和文档同样以原许可发布。