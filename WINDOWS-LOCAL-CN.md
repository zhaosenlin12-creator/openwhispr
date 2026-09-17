# OpenWhispr Windows 本地运行手册

本仓库 fork 自 [OpenWhispr/openwhispr](https://github.com/OpenWhispr/openwhispr)，在上面做了 **Windows + 国内网络** 场景下的可用性修补。这份文档只讲怎么把这套东西在本机跑起来，按章节看即可，不必从头到尾读。

## 这个分支改了什么

相对上游 main，我们调整了下面这些点，每一项都对应一个真实踩过的坑：

1. **国内网络访问 HF 模型**：把所有 `huggingface.co` 替换为 `hf-mirror.com`，避免 `download:embedding-model` / `download:whisper-vad-model` 等脚本在 `npm run dev` 阶段拉模型时直接失败。
2. **`predev:main` 兜底**：上游的 predev:main 链里有几个 `download:*` 步骤会因网络问题硬挂，我们在 `package.json` 里给非关键步骤加了 `|| true`。
3. **whisper.cpp 二进制**：上游只在 `prebuild` 时下载 whisper-server，`predev` 不下。本地脚本 `scripts/bootstrap-windows.js` 弥补了这个缺口。
4. **本地 Whisper 模型**：把 `ggml-base.bin` (~142 MB) 的下载入口加进 bootstrap，避免首次启动还要去设置里手点下载。
5. **`.env` 默认本地化**：项目根 `.env` 默认走本地 Whisper（`LOCAL_TRANSCRIPTION_PROVIDER=whisper` / `LOCAL_WHISPER_MODEL=small`），并把热键改成 `F8`（**不要用 Ctrl+Alt+Space，跟微信语音冲突**）。
6. **`%APPDATA%` 的 .env 同步**：新增 `scripts/bootstrap-windows.js`，每次启动时把项目 `.env` 里非空键同步到 `%APPDATA%\OpenWhispr-development\.env`，避免两份配置打架。
7. **环境变量覆盖逻辑保留**：上游 `src/config/constants.ts` 里 `process.env` 优先于 `import.meta.env`，所以根 `.env` 修改会立即生效。

> 上游代码本身改动很小（~100 行），主要是下载脚本 + 一处 `transcriptionRoute.ts` 的兜底 + vite define；见 `git log` 自行对比。

---

## 一键启动（Windows）

**推荐用 `start-fast.bat`**：直接调已下好的 Electron 加载 production 渲染结果，**5-8 秒启动**，无 Vite、无 dev 编译。

```cmd
start-fast.bat
```

**停止**：双击 `stop.bat`（强杀所有相关 electron 进程 + 释放 5183 端口）。

### 什么时候用 `start.bat`（dev 模式）

`start.bat` = 启动 Vite + Electron dev 模式，**首次启动 1-2 分钟**（要跑 12 个 native 编译 + 6 个下载）。只在你**改源码**热重载时才需要。普通使用请用 `start-fast.bat`。

`start.bat` 会：

1. 加载 MSVC 环境（让 native C++ 编译能找到 `cl.exe`）
2. 调用 `scripts/bootstrap-windows.js` 把 `.env` 同步到 `%APPDATA%` 并下载 whisper 二进制 + ggml-small 模型
3. 启动 `npm run dev`（Vite + Electron）

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
LOCAL_WHISPER_MODEL=small
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

### 9. 改了 `src/config/constants.ts` 里 `DEFAULT_OPENAI_BASE` 后所有用户都连错端点

**症状**：本 fork 在改 OpenAI base URL 兜底值时，曾硬编码指向 `api.minimaxi.com` —— 只有这台机器的 fork 会这样，但合到 main 之后任何拉取者都会被强行指向那个端点。

**原因**：hardcoded fallback 不会被用户的 `.env` 覆盖。

**解法**：本仓库已经回退到上游默认（`https://api.openai.com/v1`），如果你想切到自托管 / MiniMax / 其它 OpenAI 兼容端点，在 `.env` 里设置 `OPENAI_BASE_URL` / `OPENWHISPR_OPENAI_BASE_URL` 即可，不需要改源码。

### 10. 启动时 `Port 5183 is already in use` 然后整个 dev 进程退出

**症状**：双击 `start.bat` 之后黑窗一闪就没了，Vite 报 `error when starting dev server: Error: Port 5183 is already in use`。

**原因**：上一次 `start.bat` 跑起来的 `node` / `electron` 进程还活着（按了窗口 X 只是关 UI，没杀后台），新的 dev 进程拿不到端口直接退出。

**解法**：先双击 `stop.bat`（这个版本会按命令行的 `openwhispr` 关键字杀进程，并强制释放 5183 端口），再 `start.bat`。

### 11. 启动后卡在 "Choose your OpenWhispr setup"，顶部红条 "Network request failed"

**症状**：双击启动后窗口停在 "Choose your OpenWhispr setup"（选 Cloud / Local），点 Continue 顶部就一条红色 "Network request failed. Check your connection."，本地完全能上网。

**原因**：`cloud-health-check` IPC 在 `VITE_OPENWHISPR_API_URL` 为空时返回 `{ok:false, messageKey:"...cloudUnreachable.generic"}`，onboarding 把这条当成"云连不上"硬挂掉；而上游的 Better Auth session 因为历史原因残留了 `isSignedIn=true`，触发 cloud reconcile 又再失败一次。

**解法**：本地使用根本不需要走 cloud，所以在项目根 `.env` 里加一行：

```env
OPENWHISPR_SKIP_ONBOARDING=1
```

然后重建渲染层（**重要，flag 是编译期注入的，必须重建才生效**）：

```cmd
npm run build:renderer
start-fast.bat
```

打开后直接就是 Control Panel，不走任何 onboarding、不弹 "Network request failed"。如果之前手贱点过 Continue 留下了脏 session，先把下面的文件清掉再启动：

```cmd
del /q /f "%APPDATA%\OpenWhispr-development\account-scope-binding.json" "%APPDATA%\OpenWhispr-development\auth-token.bin" "%APPDATA%\OpenWhispr-development\Local State"
rmdir /s /q "%APPDATA%\OpenWhispr-development\Local Storage" "%APPDATA%\OpenWhispr-development\Session Storage"
```

想恢复 onboarding 把那一行的 `=1` 改成空、`npm run build:renderer` 重建即可。

### 12. F8 按住说话后历史里全是 "Transcription failed: OpenWhispr API URL not configured"

**症状**：F8 按住说话能录音,松开后历史里出现 "Transcription failed",错误是 "OpenWhispr API URL not configured"。窗口本身没红条,只是录音条目失败。

**原因**：`.env` 里 `LOCAL_TRANSCRIPTION_PROVIDER=whisper` 只是告诉 sttpt 用哪个本地引擎,**不会**自动把"走本地"这个开关打开。`useLocalWhisper`(在 settings store 里、默认 `false`)才是 audioManager 真正看的路由决策。`.env` 配得再本地,这个开关是 `false` 的话,dictation 还是会走 `cloudTranscribe` IPC,IPC 那边 `VITE_OPENWHISPR_API_URL` 是空的就抛 "API URL not configured"。

**解法**：仓库 `settingsStore.ts` 的 `initializeSettings` 现在带了 bootstrap:只要 `OPENWHISPR_SKIP_ONBOARDING=1` 编译期被注入,渲染层启动时如果发现用户从没碰过 `useLocalWhisper` toggle,**自动**把它设成 `true` 一次并写入 localStorage。所以你不用手动进设置,启动一次就行。

但前提是 `OPENWHISPR_SKIP_ONBOARDING=1` 必须在 `.env` 里(本地使用 99% 情况都该有),并且 `npm run build:renderer` 跑过把这个 flag 烤进 dist(它是编译期注入的)。如果 bootstrap 没生效,99% 是因为:`OPENWHISPR_SKIP_ONBOARDING=` 是空的、或者没重建、或者 leveldb 里残留了 `useLocalWhisper=false` 把首次启动覆盖掉了(把这条清掉重启就行)。

### 13. 窗口停在 "Loading..." 转圈,顶部一条 "Codex++" 标签

**症状**:启动后窗口中央一直转蓝色 spinner,文字 "Loading...",死活不出 Control Panel。F8 在系统里也按了没反应(热键被压在 main 那边没释放)。

**原因**:在本地模式下 `OPENWHISPR_SKIP_ONBOARDING=1` 跳过的是 onboarding,**没有跳过 auth**。`useAuth` 还是会尝试解析 Better Auth session 并 reconcile 一个空的 account scope,反复失败但 `authLoaded` 始终是 `false`,`isLoading` 也就永远不结束 → `AppRouter` 一直返回 `LoadingFallback`。同时 `setOnboardingActive(true)` 从来没机会被调用,main 进程的 hotkey 也一直被压在 onboarding 期。

**解法**:已修了。`src/AppRouter.jsx` 现在在 `OPENWHISPR_SKIP_ONBOARDING=1` 时直接强制 `setIsLoading(false)`,且渲染层所有 onboarding/reauth 门都加 `&& !skipOnboarding` 跳过条件,直接出 ControlPanel。**前提还是老话**:`.env` 里有 `OPENWHISPR_SKIP_ONBOARDING=1`、跑过 `npm run build:renderer`、`%APPDATA%\OpenWhispr-development\Local Storage` 清过(让 bootstrap 能跑)。

### 14. 中文短句被识别成日文(以上就是了 → 以上就是了よ)

**症状**:F8 说完中文,粘贴出来却是中文+日文假名混在一起,比如 `以上就是了` 变成 `以上就是了よ` 或 `以上就是だよ`。短的、带汉字的句子里最容易出现,长一点的、上下文多的反而正常。

**原因**:whisper.cpp v1.9.x 的 `--language auto` 自带语种检测,在用户没指定语言时会自动挑一个 base language。短句 + 汉字的组合下,它经常把中文判成日语,然后按日语的发音规则去"翻译"汉字,于是冒出 `よ` `だよ` 这种假名尾巴。**不是模型坏了,是命令行的 `--language` 给错了。**

要确认命令行有没有带错,先启动一次应用,然后在 PowerShell 里查 whisper-server 进程:
```powershell
Get-CimInstance Win32_Process |
  Where-Object { $_.Name -like '*whisper-server*' } |
  Select-Object ProcessId, CommandLine
```
正确应该看到 `--language zh`(或其它 base code),**绝不能是 `--language auto`**。如果是 auto,就是下面这条没修复到老。

**解法**:本仓库 commit `1390d152` 已经把语言钉进 server prewarm:
- `main.js` 把 `process.env.DICTATION_LANGUAGE` 透传给 `whisperManager.initializeAtStartup`。
- `src/helpers/whisper.js` 的 `_resolveBaseLanguage` 把 `zh-CN` 折成 `zh`(其它带 region 的同理),然后在启动 whisper-server 时传 `language: "zh"`,命令行的 `--language` 就再也不是 `auto` 了。
- `src/helpers/whisperServer.js` 的 `getLanguageSignature` 把语言并进了 `start()` 的 no-op 保护,以后用户改语言会强制重启 server,不会再让旧的 `auto` 进程留着。
- `src/stores/settingsStore.ts` 默认值改成 `zh-CN`,并把已存的 `auto` 迁到 `zh-CN`,新装和升级都直接进入"说中文"模式。

**自查 5 步**(已修过一遍还想再确认的话):
1. 看 `%APPDATA%\OpenWhispr-development\.env` 第一段 `DICTATION_LANGUAGE=zh-CN`(注意不是 `auto`)。这是用户数据,被 IPC sync-startup-preferences 每次启动会重写,被它改回 `auto` 就代表 Settings → 语言选择器里还是 `auto`,要去 UI 里选 `中文`。
2. 看 PowerShell 上面的命令,确认 `--language zh`。
3. 看日志 `%APPDATA%\OpenWhispr-development\logs\debug-*.log`,搜 `Pre-warming whisper-server`,日志对象里应该有 `"language": "zh"` 这一行,没有就回到 main.js 的 `whisperSettings` 检查 `language` 字段。
4. `npm run build:renderer` 重新跑一遍,renderer 的 default 也是 `zh-CN` 才会落到 localStorage。
5. `stop.bat` 杀干净,再 `start-fast.bat` 启一次。

**多语种怎么开**:whisper-server 一次只支持一种 base language。如果你要中英混说、或者今天中文明天英文,在 Settings → 语言 → "转写语言"里选 `自动检测`(`auto`),代价就是上面这条短句误识别;不混语种就保持 `中文`(`zh-CN`)。要在 UI 之外改,直接编辑 `%APPDATA%\OpenWhispr-development\.env` 的 `DICTATION_LANGUAGE=zh-CN`,然后 `stop.bat` 重启。

---

## 模型选择

| 模型 | 大小 | 中文 | 英文 | 速度 | 适用场景 |
| --- | --- | --- | --- | --- | --- |
| Whisper ggml-tiny | 75 MB | 弱 | 一般 | 极快 | 英文短指令 |
| Whisper ggml-base | 142 MB | 中（短句偶尔误判日语） | 一般 | 快 | 低配机器临时用 |
| **Whisper ggml-small** | **466 MB** | **✅** | **✅** | **中等** | **默认推荐**，中文/英文日常，CPU 上单句 < 1s |
| Whisper ggml-medium | 1.5 GB | ✅ | ✅ | 慢 | 高质量长录音 |
| Whisper ggml-large-v3-turbo | 1.6 GB | ✅ | ✅ | 慢 | 顶配机器，追求极致 |
| Orukeet v0.1.0 | 671 MB | ❌ | ❌ | 快 | **欧洲语言**，不支持中文 |
| Cohere Transcribe | 1.7 GB | ✅ | ✅ | 慢 | 14 语种多语言 |

切换模型：改 `.env` 的 `LOCAL_WHISPER_MODEL=`，重启后会自动下载。

---

## 调试

**日志位置**：`%APPDATA%\OpenWhispr-development\logs\debug-<timestamp>.log`，按 LastWriteTime 倒序找最新的。

**录制但没识别**：搜 `Recording stopped`，看后面有没有 `whisper-server transcription completed`。如果没有，说明录音正常但没识别成功，看 [踩坑 #5]。

**识别出来是日文/中英混杂**：命令行错了，`--language` 应该跟用户语种走，不该是 `auto`。看 [踩坑 #14] 的自查 5 步。

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