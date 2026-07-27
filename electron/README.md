# 🖥️ OmniBiz-AI Desktop Application Wrapper (`electron/`)

The `electron/` directory contains the configuration files and main process scripts to wrap **OmniBiz-AI** into a standalone, cross-platform desktop application (macOS DMG/App and Windows EXE) using [Electron](https://www.electronjs.org/).

---

## 📁 Subdirectory File Breakdown

```text
electron/
├── main.cjs       # Electron main process script initializing BrowserWindow, native menus, & security rules
└── preload.cjs    # Isolated preload script exposing safe IPC channels to the web renderer
```

---

## 🛠️ How It Works

1. **Main Process (`main.cjs`)**:
   - Spawns a frameless or native titlebar OS window (1366x768 default).
   - Loads local static production files from `../dist/index.html` (or connects to `http://localhost:5173` during development).
   - Handles app lifecycle events (`window-all-closed`, `activate`).

2. **Preload Script (`preload.cjs`)**:
   - Uses `contextBridge.exposeInMainWorld` to pass safe native OS capabilities to the React web context.

---

## 🚀 Building Native Desktop Binaries

To package OmniBiz-AI into native desktop installers:

```bash
# 1. Compile the web app build into /dist
npm run build

# 2. Package into macOS DMG / Application installer
npm run electron:build
```

The output installers will be generated inside the `dist_electron/` directory:
- **macOS**: `OmniBiz AI-0.0.0.dmg`
- **Windows**: `OmniBiz AI Setup 0.0.0.exe` (when targeted on Windows).
