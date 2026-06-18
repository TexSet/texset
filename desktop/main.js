// Electron shell for TexSet. It runs the Next.js standalone server in the
// background (with Electron's own Node via ELECTRON_RUN_AS_NODE) and shows it in
// a window. A small bundled TeX distribution (TinyTeX) is pointed at through
// TEXSET_TEX_BIN_DIR; if the user already has a system LaTeX install, the app
// prefers that one (see src/lib/tex.ts).
const { app, BrowserWindow, shell } = require("electron");
const { spawn } = require("node:child_process");
const path = require("node:path");
const http = require("node:http");

const PORT = 7475;
const ORIGIN = `http://127.0.0.1:${PORT}`;

let serverProcess = null;

// In a packaged build, resources live under process.resourcesPath. In dev we run
// against the repo so you can iterate without packaging.
function resource(...parts) {
  return app.isPackaged
    ? path.join(process.resourcesPath, ...parts)
    : path.join(__dirname, "..", ...parts);
}

// TinyTeX lays its binaries out per platform.
function tinytexBinDir() {
  const platformDir =
    process.platform === "win32"
      ? "windows"
      : process.platform === "darwin"
        ? "universal-darwin"
        : "x86_64-linux";
  return resource("tinytex", "bin", platformDir);
}

function startServer() {
  const serverDir = resource("standalone");
  serverProcess = spawn(process.execPath, [path.join(serverDir, "server.js")], {
    cwd: serverDir,
    env: {
      ...process.env,
      ELECTRON_RUN_AS_NODE: "1",
      PORT: String(PORT),
      HOSTNAME: "127.0.0.1",
      TEXSET_DATA_DIR: path.join(app.getPath("userData"), "projects"),
      TEXSET_TEX_BIN_DIR: tinytexBinDir(),
    },
    stdio: "inherit",
  });
  serverProcess.on("exit", () => {
    serverProcess = null;
  });
}

// Wait until the server answers before showing the window.
function whenServerReady(onReady, attempt = 0) {
  http
    .get(ORIGIN, () => onReady())
    .on("error", () => {
      if (attempt > 100) return; // ~20s, give up quietly
      setTimeout(() => whenServerReady(onReady, attempt + 1), 200);
    });
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    title: "TexSet",
    backgroundColor: "#0f1115",
    webPreferences: { contextIsolation: true },
  });
  win.loadURL(ORIGIN);
  // open external links (install guides, etc.) in the system browser
  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });
}

app.whenReady().then(() => {
  startServer();
  whenServerReady(createWindow);
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("quit", () => {
  serverProcess?.kill();
});
