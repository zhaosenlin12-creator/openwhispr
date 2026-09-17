<p align="center">
  <img src="src/assets/logo.svg" alt="OpenWhispr" width="120" />
</p>

<h1 align="center">OpenWhispr</h1>

<p align="center">
  <a href="https://github.com/OpenWhispr/openwhispr/blob/main/LICENSE"><img src="https://img.shields.io/github/license/OpenWhispr/openwhispr?style=flat" alt="License" /></a>
  <img src="https://img.shields.io/badge/platform-macOS%20%7C%20Windows%20%7C%20Linux-lightgrey?style=flat" alt="Platform" />
  <a href="https://github.com/OpenWhispr/openwhispr/releases/latest"><img src="https://img.shields.io/github/v/release/OpenWhispr/openwhispr?style=flat&sort=semver" alt="GitHub release" /></a>
  <a href="https://github.com/OpenWhispr/openwhispr/releases"><img src="https://img.shields.io/github/downloads/OpenWhispr/openwhispr/total?style=flat&color=blue" alt="Downloads" /></a>
  <a href="https://github.com/OpenWhispr/openwhispr/stargazers"><img src="https://img.shields.io/github/stars/OpenWhispr/openwhispr?style=flat" alt="GitHub stars" /></a>
</p>

<p align="center">
  The open-source and free alternative to WisprFlow and Granola.<br/>
  Privacy-first voice-to-text dictation with AI agents, meeting transcription, and notes. Cross-platform for macOS, Windows, and Linux.
</p>

<p align="center">
  <a href="https://openwhispr.com">Website</a> &middot;
  <a href="https://docs.openwhispr.com">Docs</a> &middot;
  <a href="https://github.com/OpenWhispr/openwhispr/releases/latest">Download</a> &middot;
  <a href="https://docs.openwhispr.com/api/overview">API</a> &middot;
  <a href="https://github.com/OpenWhispr/openwhispr/blob/main/CHANGELOG.md">Changelog</a>
</p>

---

## 本地运行（Windows · 中文）

> 这是基于 [OpenWhispr/openwhispr](https://github.com/OpenWhispr/openwhispr) 的本地化 fork：默认走本地 Whisper，不走 OpenWhispr Cloud、不用登录、不用注册。F8 按住说话，文字直接落到当前光标位置。

完整中文教程（含环境要求 / 安装步骤 / 日常使用 / 踩坑速查）见：[WINDOWS-LOCAL-CN.md](./WINDOWS-LOCAL-CN.md)

**TL;DR（5 分钟跑起来）：**

```cmd
git clone https://github.com/zhaosenlin12-creator/openwhispr.git
cd openwhispr
npm install
copy .env.example .env       :: Windows cmd
:: 然后在 .env 末尾加一行：OPENWHISPR_SKIP_ONBOARDING=1
npm run build:renderer
start-fast.bat
```

看到 Control Panel 窗口后，按住 **F8** 说话，松开自动写入。

**必看踩坑（5 条精选，全部 11 条见 WINDOWS-LOCAL-CN.md）：**

1. 热键不要用 `Ctrl+Alt+Space`，跟微信语音冲突；默认已经改成 `F8`。
2. 国内网络把 `huggingface.co` 换 `hf-mirror.com`（仓库已经改好）。
3. 没装 VS 2022 Build Tools 的，先装 "使用 C++ 的桌面开发" 工作负载，否则 node-gyp 编译 native 模块直接挂。
4. 别用 `start.bat` 日常使用，那条路径要 1-2 分钟；用 `start-fast.bat`（5-8 秒）。
5. 启动后卡在 "Choose your OpenWhispr setup" + 顶部红条 "Network request failed" → `.env` 加 `OPENWHISPR_SKIP_ONBOARDING=1` 然后 `npm run build:renderer` 重建。

---

OpenWhispr turns your voice into text, notes, and actions from your desktop. Press a hotkey, speak, and your words appear at your cursor. Choose between fully private offline transcription with local speech-to-text models like Orukeet, Whisper, NVIDIA Parakeet, and Cohere Transcribe — where your audio never leaves your device — or cloud processing for speed. No data collection, no telemetry, fully open source.

## Download

| Platform              | Download                                                                                                                                                                                                                                                                                  |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| macOS (Apple Silicon) | [`.dmg`](https://github.com/OpenWhispr/openwhispr/releases/latest)                                                                                                                                                                                                                        |
| macOS (Intel) \*      | [`.dmg`](https://github.com/OpenWhispr/openwhispr/releases/latest)                                                                                                                                                                                                                        |
| Windows               | [`.exe`](https://github.com/OpenWhispr/openwhispr/releases/latest)                                                                                                                                                                                                                        |
| Linux                 | [`.AppImage`](https://github.com/OpenWhispr/openwhispr/releases/latest) / [`.deb`](https://github.com/OpenWhispr/openwhispr/releases/latest) / [`.rpm`](https://github.com/OpenWhispr/openwhispr/releases/latest) / [`.tar.gz`](https://github.com/OpenWhispr/openwhispr/releases/latest) |

\* On Intel Macs, live speaker identification and voice fingerprinting are unavailable: they depend on ONNX Runtime, which [stopped shipping macOS x86_64 binaries in 1.24](https://github.com/microsoft/onnxruntime/releases/tag/v1.24.1). Meetings still record and transcribe normally, and notes search falls back to keyword matching instead of semantic search.

## Features

- **Voice dictation** — global hotkey to dictate into any app with automatic pasting
- **Dictation translation** — dedicated hotkey to dictate in one language and paste the text in another
- **AI agent** — talk to GPT-5, Claude, Gemini, Groq, Tinfoil, OpenRouter, or local models with a named voice assistant
- **Voice Assistant hotkey** — dedicated hotkey that sends what you say straight to your AI assistant as a command, no wake word needed and no cleanup pass; highlighted text is edited in place. With auto-paste enabled, answers paste at a focused text cursor or stream into a floating panel and copy to the clipboard when no writable cursor is available. You can also opt in to sending a screenshot of your current screen as context
- **Meeting transcription** — auto-detect Zoom, Teams, and FaceTime calls with live speaker diarization, voice fingerprinting, and Google, Microsoft, or Apple Calendar integration
- **Local speaker diarization** — on-device speaker labelling with voice fingerprint recognition across meetings, no cloud required
- **Notes** — create, organize, and search notes with folders, semantic search, cloud sync, and AI actions
- **Team spaces & sharing** — free for signed-in users; share notes on the web with link, domain, or invite-only visibility, and collaborate in team spaces with roles, invitations, and server-enforced membership
- **Audio import** — transcribe existing audio and video: drag in files, batch-upload, or paste a YouTube/audio URL, with optional speaker detection
- **Local or cloud — your choice** — all core features (transcription, AI reasoning, speaker diarization, semantic search) work with local models or cloud providers — including GPU-accelerated local Whisper on Metal, CUDA, and Vulkan (AMD/Intel)
- **Enterprise controls** — enforce organization policy, company SSO and SCIM, and centrally managed Amazon Bedrock or Azure OpenAI access without distributing cloud keys
- **Public API & MCP** — manage notes and transcriptions programmatically or connect your AI assistant via the [MCP server](https://docs.openwhispr.com/integrations/mcp)

## Quick start

```bash
git clone https://github.com/OpenWhispr/openwhispr.git
cd openwhispr
npm install
npm run dev
```

Requires Node.js 24+. See the [full documentation](https://docs.openwhispr.com/quickstart) for setup guides, platform-specific instructions, and build details.

## Documentation

Visit **[docs.openwhispr.com](https://docs.openwhispr.com)** for:

- [Getting started](https://docs.openwhispr.com/quickstart)
- [Platform guides](https://docs.openwhispr.com/platform/macos) (macOS, Windows, Linux)
- [API reference](https://docs.openwhispr.com/api/overview)
- [MCP server setup](https://docs.openwhispr.com/integrations/mcp)
- [Troubleshooting](https://docs.openwhispr.com/troubleshooting)

Repo examples:

- [Custom ASR shim](examples/custom-asr-shim/) for Self-Hosted transcription against non-OpenAI-compatible ASR APIs

## Tech stack

React 19, TypeScript, Tailwind CSS v4, Electron 41, better-sqlite3, whisper.cpp, sherpa-onnx, shadcn/ui

## Star History

[![Star History Chart](https://api.star-history.com/svg?repos=OpenWhispr/openwhispr&type=date&legend=top-left)](https://www.star-history.com/#OpenWhispr/openwhispr&type=date&legend=top-left)

## Sponsors

<p align="center">
  <a href="https://console.neon.tech/app/?promo=openwhispr">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="https://neon.com/brand/neon-logo-dark-color.svg">
      <source media="(prefers-color-scheme: light)" srcset="https://neon.com/brand/neon-logo-light-color.svg">
      <img width="250" alt="Neon" src="https://neon.com/brand/neon-logo-light-color.svg">
    </picture>
  </a>
</p>

<p align="center"><a href="https://console.neon.tech/app/?promo=openwhispr">Neon</a> is the serverless Postgres platform powering OpenWhispr Cloud.</p>

## Contributing

We welcome contributions. Fork the repo, create a feature branch, and open a pull request. See the [contributing guide](https://docs.openwhispr.com/contributing) for development setup and guidelines.

## License

[MIT](LICENSE) — free for personal and commercial use.

## Acknowledgments

- **[OpenAI Whisper](https://github.com/openai/whisper)** — speech recognition model powering local and cloud transcription
- **[whisper.cpp](https://github.com/ggerganov/whisper.cpp)** — high-performance C++ implementation for local processing
- **[NVIDIA Parakeet](https://huggingface.co/nvidia/parakeet-tdt-0.6b-v3)** — fast multilingual ASR model
- **[sherpa-onnx](https://github.com/k2-fsa/sherpa-onnx)** — cross-platform ONNX runtime for Parakeet inference
- **[Hugging Face](https://huggingface.co/)** — model hub hosting Whisper, Parakeet, and embedding model weights
- **[llama.cpp](https://github.com/ggerganov/llama.cpp)** — local LLM inference for AI text processing
- **[Electron](https://www.electronjs.org/)** — cross-platform desktop framework
- **[React](https://react.dev/)** — UI component library
- **[shadcn/ui](https://ui.shadcn.com/)** — accessible components built on Radix primitives
- **[Neon](https://console.neon.tech/app/?promo=openwhispr)** — serverless Postgres powering OpenWhispr Cloud

---

## 本仓库：Windows + 国内网络本地运行版

这是 [上游 OpenWhispr/openwhispr](https://github.com/OpenWhispr/openwhispr) 的本地化 fork。改动目的：让你在 **Windows + 国内网络** 环境下开箱即用，按一个全局热键就能把中文语音识别结果粘贴到任意输入框（微信 / VS Code / 浏览器 / Word …），默认不连云端。

完整教程（环境要求、安装、配置、模型选择、调试、卸载、构建安装包）见 **[WINDOWS-LOCAL-CN.md](./WINDOWS-LOCAL-CN.md)**。

### 改动一览

- 把 `huggingface.co` 全部替换为 `hf-mirror.com`，让模型下载在国内不挂
- `predev:main` 步骤加 `|| true` 容错，避免网络抖动让 `npm run dev` 整体失败
- 补全 `predev:main` 漏掉的 whisper.cpp 二进制下载（新增 `scripts/bootstrap-windows.js`）
- 启动时自动下载 `ggml-base.bin`（142 MB），首次启动后即可离线 STT
- 默认配置：本地 Whisper + 中文 + **F8** 热键（**不要用 `Ctrl+Alt+Space`，跟微信语音冲突**）
- `bootstrap-windows.js` 每次启动把项目 `.env` 同步到 `%APPDATA%\OpenWhispr-development\.env`，避免两份配置打架
- `.env` 里所有 API key 默认留空，clone 下来直接走本地 Whisper，不会偷偷连云端
- `stop.bat` 改用 `scripts/stop-dev.ps1`，按命令行 / 进程 CWD 关键字杀进程并释放 Vite 端口 5183
- **新增 `start-fast.bat` 直接调 Electron 加载 production 渲染，5-8 秒启动**，跳过 Vite / predev:main / npm 整条慢链

### 一键启动

环境：Windows 10/11 + Node.js 24+ + VS 2022 Build Tools（含"使用 C++ 的桌面开发"）。

```cmd
git clone https://github.com/zhaosenlin12-creator/openwhispr.git
cd openwhispr
npm install
start-fast.bat
```

`start-fast.bat` 直接调已下好的 Electron 加载 production 渲染，**5-8 秒启动**。
`start.bat` 是 dev 模式（Vite + 热重载），首次启动 1-2 分钟，只在改源码时用。

启动成功后会看到主窗口 + 任务栏托盘图标。在任意输入框里按 **F8 → 说话 → 再按 F8**，识别结果会粘贴到当前焦点窗口。

**停止**：双击 `stop.bat`，或在托盘右键菜单选 Exit。**不要用窗口右上角的 X 关闭**，否则后台进程会留着。

### 踩坑速查（详细版在 WINDOWS-LOCAL-CN.md）

1. **热键冲突** — `Ctrl+Alt+Space` 被微信语音抢走，换 `F8` 或 `F9`
2. **`Port 5183 is already in use`** — 上一轮进程没清干净，先 `stop.bat` 再 `start-fast.bat`
3. **electron 下载卡死** — 项目里已预放好 `node_modules\electron\dist\`；新机器 clone 后设 `ELECTRON_MIRROR=https://npmmirror.com/mirrors/electron/`
4. **HF 拉不到模型** — 已全量换 `hf-mirror.com`
5. **MSVC 找不到** — `start.bat` 已 `call vcvars64.bat`；手动跑 dev 自己 call 一次
6. **whisper-server 找不到** — `bootstrap-windows.js` 会自动下
7. **改了 .env 不生效** — `stop.bat` 再 `start.bat` 重新同步到 `%APPDATA%`
8. **401 login fail** — 本地 Whisper 默认走离线，**不会触发**；要走云端把 `OPENAI_BASE_URL` / `OPENWHISPR_OPENAI_BASE_URL` / `WHISPER_BASE_URL` 同时配齐
9. **LevelDB 改了不生效** — 先 `stop.bat` 再改文件

详细踩坑（含每条的根因 + 验证步骤）见 [WINDOWS-LOCAL-CN.md](./WINDOWS-LOCAL-CN.md)。
