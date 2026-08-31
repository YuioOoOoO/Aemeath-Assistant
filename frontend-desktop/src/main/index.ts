/* eslint-disable no-shadow */
import { app, ipcMain, globalShortcut, desktopCapturer } from "electron";
import { electronApp, optimizer } from "@electron-toolkit/utils";
import { WindowManager } from "./window-manager";
import { MenuManager } from "./menu-manager";
import { BackendManager } from "./backend-manager";

let windowManager: WindowManager;
let menuManager: MenuManager;
const backendManager = new BackendManager();
let isQuitting = false;

// The microphone VAD creates its AudioContext during automatic application
// startup, before any mouse/keyboard gesture. Chromium otherwise leaves that
// context suspended even though media permission was granted.
app.commandLine.appendSwitch("autoplay-policy", "no-user-gesture-required");

function setupIPC(): void {
  ipcMain.handle("get-platform", () => process.platform);

  ipcMain.on("set-ignore-mouse-events", (_event, ignore: boolean) => {
    const window = windowManager.getWindow();
    if (window) {
      windowManager.setIgnoreMouseEvents(ignore);
    }
  });

  ipcMain.on("set-force-ignore-mouse", (_event, forceIgnore: boolean) => {
    windowManager.setForceIgnoreMouse(forceIgnore);
  });

  ipcMain.on("get-current-mode", (event) => {
    event.returnValue = windowManager.getCurrentMode();
  });

  ipcMain.on("pre-mode-changed", (_event, newMode) => {
    if (newMode === 'window' || newMode === 'pet') {
      menuManager.setMode(newMode);
    }
  });

  ipcMain.on("window-minimize", () => {
    windowManager.minimizeWindow();
  });

  ipcMain.on("window-maximize", () => {
    const window = windowManager.getWindow();
    if (window) {
      windowManager.maximizeWindow();
    }
  });

  ipcMain.on("window-close", () => {
    windowManager.hideToTray();
  });

  ipcMain.on(
    "update-component-hover",
    (_event, componentId: string, isHovering: boolean) => {
      windowManager.updateComponentHover(componentId, isHovering);
    },
  );

  ipcMain.handle("get-config-files", () => {
    const configFiles = JSON.parse(localStorage.getItem("configFiles") || "[]");
    menuManager.updateConfigFiles(configFiles);
    return configFiles;
  });

  ipcMain.on("update-config-files", (_event, files) => {
    menuManager.updateConfigFiles(files);
  });

  ipcMain.handle('get-screen-capture', async () => {
    const sources = await desktopCapturer.getSources({ types: ['screen'] });
    return sources[0].id;
  });
}

app.whenReady().then(async () => {
  electronApp.setAppUserModelId("com.aimisi.desktop-assistant");

  try {
    await backendManager.ensureStarted();
  } catch (error) {
    console.error('[Backend] Automatic startup failed:', error);
  }

  windowManager = new WindowManager();
  menuManager = new MenuManager((mode) => windowManager.setWindowMode(mode));
  // Register startup-state IPC before loading the renderer. The renderer uses
  // it synchronously while choosing its initial saved mode.
  setupIPC();

  const window = windowManager.createWindow({
    titleBarOverlay: {
      color: "#111111",
      symbolColor: "#FFFFFF",
      height: 30,
    },
  });
  menuManager.createTray();

  window.on("close", (event) => {
    if (!isQuitting) {
      event.preventDefault();
      windowManager.hideToTray();
    }
    return false;
  });

  // if (process.env.NODE_ENV === "development") {
  //   globalShortcut.register("F12", () => {
  //     const window = windowManager.getWindow();
  //     if (!window) return;

  //     if (window.webContents.isDevToolsOpened()) {
  //       window.webContents.closeDevTools();
  //     } else {
  //       window.webContents.openDevTools();
  //     }
  //   });
  // }

  app.on("activate", () => {
    const window = windowManager.getWindow();
    if (window) {
      windowManager.showWindow();
    }
  });

  app.on("browser-window-created", (_, window) => {
    optimizer.watchWindowShortcuts(window);
  });

  app.on('web-contents-created', (_, contents) => {
    contents.session.setPermissionRequestHandler((webContents, permission, callback) => {
      if (permission === 'media') {
        callback(true);
      } else {
        callback(false);
      }
    });
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("before-quit", () => {
  isQuitting = true;
  backendManager.stop();
  menuManager.destroy();
  globalShortcut.unregisterAll();
});
