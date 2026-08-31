import {
  app, BrowserWindow, screen, shell, ipcMain,
} from 'electron';
import { join } from 'path';
import { readFileSync, writeFileSync } from 'fs';
import { is } from '@electron-toolkit/utils';

const isMac = process.platform === 'darwin';

interface PersistedWindowState {
  bounds: Electron.Rectangle;
  maximized: boolean;
  mode: 'window' | 'pet';
}

export class WindowManager {
  private window: BrowserWindow | null = null;

  private petCursorTimer: NodeJS.Timeout | null = null;

  private windowedBounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  } | null = null;

  private hoveringComponents: Set<string> = new Set();

  private currentMode: 'window' | 'pet' = 'window';

  // Track if mouse events are forcibly ignored
  private forceIgnoreMouse = false;

  private boundsSaveTimer: NodeJS.Timeout | null = null;

  private restoreMaximized = false;

  private windowMaximized = false;

  private getWindowStatePath(): string {
    return join(app.getPath('userData'), 'window-state.json');
  }

  private loadWindowState(): PersistedWindowState | undefined {
    try {
      const persisted = JSON.parse(readFileSync(this.getWindowStatePath(), 'utf8'));
      // Backward compatibility with the previous bounds-only format.
      const bounds = persisted?.bounds || persisted;
      if (![bounds?.x, bounds?.y, bounds?.width, bounds?.height].every(Number.isFinite)) return undefined;
      if (bounds.width < 480 || bounds.height < 360) return undefined;
      const visible = screen.getAllDisplays().some((display) => {
        const area = display.workArea;
        return bounds.x < area.x + area.width
          && bounds.x + bounds.width > area.x
          && bounds.y < area.y + area.height
          && bounds.y + bounds.height > area.y;
      });
      const mode = persisted?.mode === 'pet' ? 'pet' : 'window';
      return visible ? { bounds, maximized: persisted?.maximized === true, mode } : undefined;
    } catch {
      return undefined;
    }
  }

  private persistWindowState(maximized = false): void {
    if (!this.window || this.window.isDestroyed()) return;
    this.windowMaximized = maximized;
    const bounds = maximized && this.windowedBounds
      ? this.windowedBounds
      : this.window.getBounds();
    this.windowedBounds = bounds;
    try {
      writeFileSync(
        this.getWindowStatePath(),
        JSON.stringify({ bounds, maximized, mode: this.currentMode } satisfies PersistedWindowState),
        'utf8',
      );
    } catch (error) {
      console.warn('[Window] Failed to save window state:', error);
    }
  }

  private persistCurrentMode(): void {
    if (!this.window || this.window.isDestroyed()) return;
    const bounds = this.windowedBounds || this.window.getBounds();
    try {
      writeFileSync(
        this.getWindowStatePath(),
        JSON.stringify({
          bounds,
          maximized: this.windowMaximized,
          mode: this.currentMode,
        } satisfies PersistedWindowState),
        'utf8',
      );
    } catch (error) {
      console.warn('[Window] Failed to save current mode:', error);
    }
  }

  private scheduleWindowBoundsSave(): void {
    if (!this.window || this.currentMode !== 'window' || this.isWindowMaximized()) return;
    if (this.boundsSaveTimer) clearTimeout(this.boundsSaveTimer);
    this.boundsSaveTimer = setTimeout(() => {
      if (!this.window || this.window.isDestroyed() || this.currentMode !== 'window') return;
      const bounds = this.window.getBounds();
      this.windowedBounds = bounds;
      this.persistWindowState(false);
    }, 180);
  }

  constructor() {
    ipcMain.on('renderer-ready-for-mode-change', (_event, newMode) => {
      if (newMode === 'pet') {
        setTimeout(() => {
          this.continueSetWindowModePet();
        }, 500);
      } else {
        setTimeout(() => {
          this.continueSetWindowModeWindow();
        }, 500);
      }
    });

    ipcMain.on('mode-change-rendered', () => {
      this.window?.setOpacity(1);
    });

    ipcMain.on('window-unfullscreen', () => {
      const window = this.getWindow();
      if (window && window.isFullScreen()) {
        window.setFullScreen(false);
      }
    });

    // Handle toggle force ignore mouse events from renderer
    ipcMain.on('toggle-force-ignore-mouse', () => {
      this.toggleForceIgnoreMouse();
    });
  }

  createWindow(options: Electron.BrowserWindowConstructorOptions): BrowserWindow {
    const savedState = this.loadWindowState();
    const savedBounds = savedState?.bounds;
    if (savedBounds) this.windowedBounds = savedBounds;
    this.restoreMaximized = savedState?.maximized === true;
    this.windowMaximized = savedState?.maximized === true;
    this.currentMode = savedState?.mode || 'window';
    this.window = new BrowserWindow({
      width: 900,
      height: 670,
      show: false,
      transparent: true,
      backgroundColor: '#00000000',
      autoHideMenuBar: true,
      frame: false,
      icon: process.platform === 'win32'
        ? join(__dirname, '../../resources/aimisi.ico')
        : join(__dirname, '../../resources/icon.png'),
      ...(isMac ? { titleBarStyle: 'hiddenInset' } : {}),
      webPreferences: {
        preload: join(__dirname, '../preload/index.js'),
        sandbox: false,
        contextIsolation: true,
        nodeIntegration: true,
      },
      hasShadow: false,
      // A Windows `toolbar` window is permanently treated as a tool window and
      // cannot reliably be added back to the taskbar with setSkipTaskbar(false).
      // Keep the main BrowserWindow a normal frameless window and control its
      // taskbar presence exclusively from the current application mode.
      skipTaskbar: this.currentMode === 'pet',
      paintWhenInitiallyHidden: true,
      ...options,
      ...(savedBounds || {}),
    });

    this.setupWindowEvents();
    this.startPetCursorTracking();
    this.loadContent();

    this.window.on('enter-full-screen', () => {
      this.window?.webContents.send('window-fullscreen-change', true);
    });

    this.window.on('leave-full-screen', () => {
      this.window?.webContents.send('window-fullscreen-change', false);
    });

    return this.window;
  }

  private startPetCursorTracking(): void {
    if (this.petCursorTimer) clearInterval(this.petCursorTimer);

    // Mousemove forwarding from a click-through Electron window can be
    // unreliable on Windows. Poll the cursor so the renderer can still
    // enable interaction when it reaches the visible Live2D model.
    this.petCursorTimer = setInterval(() => {
      if (this.currentMode !== 'pet' || !this.window || this.window.isDestroyed()) return;

      const point = screen.getCursorScreenPoint();
      const bounds = this.window.getBounds();
      this.window.webContents.send('pet-cursor-move', {
        clientX: point.x - bounds.x,
        clientY: point.y - bounds.y,
      });
    }, 50);

    this.petCursorTimer.unref();
    this.window?.once('closed', () => {
      if (this.petCursorTimer) clearInterval(this.petCursorTimer);
      this.petCursorTimer = null;
    });
  }

  private setupWindowEvents(): void {
    if (!this.window) return;

    this.window.on('ready-to-show', () => {
      this.window?.setSkipTaskbar(this.currentMode === 'pet');
      if (this.restoreMaximized && this.currentMode === 'window' && this.window) {
        this.restoreMaximized = false;
        const display = screen.getDisplayMatching(this.windowedBounds || this.window.getBounds());
        this.window.setBounds(display.workArea);
      }
      this.window?.show();
      this.window?.setSkipTaskbar(this.currentMode === 'pet');
      this.window?.webContents.send(
        'window-maximized-change',
        this.isWindowMaximized(),
      );
    });

    this.window.on('maximize', () => {
      this.windowMaximized = true;
      this.persistWindowState(true);
      this.window?.webContents.send('window-maximized-change', true);
    });

    this.window.on('unmaximize', () => {
      this.windowMaximized = false;
      this.scheduleWindowBoundsSave();
      this.window?.webContents.send('window-maximized-change', false);
    });

    this.window.on('resize', () => {
      const window = this.getWindow();
      if (window) {
        window.webContents.send('window-maximized-change', this.isWindowMaximized());
        this.scheduleWindowBoundsSave();
      }
    });

    this.window.on('move', () => this.scheduleWindowBoundsSave());

    this.window.webContents.setWindowOpenHandler((details) => {
      shell.openExternal(details.url);
      return { action: 'deny' };
    });
  }

  private loadContent(): void {
    if (!this.window) return;

    if (is.dev && process.env.ELECTRON_RENDERER_URL) {
      this.window.loadURL(process.env.ELECTRON_RENDERER_URL);
    } else {
      this.window.loadFile(join(__dirname, '../renderer/index.html'));
    }
  }

  setWindowMode(mode: 'window' | 'pet'): void {
    if (!this.window) return;

    this.currentMode = mode;
    this.persistCurrentMode();
    this.window.setOpacity(0);

    if (mode === 'window') {
      this.setWindowModeWindow();
    } else {
      this.setWindowModePet();
    }
  }

  private setWindowModeWindow(): void {
    if (!this.window) return;

    this.window.setAlwaysOnTop(false);
    this.window.setIgnoreMouseEvents(false);
    this.window.setSkipTaskbar(false);
    this.window.setResizable(true);
    this.window.setFocusable(true);
    this.window.setAlwaysOnTop(false);

    // Keep the native window transparent so the renderer's rounded outer
    // corners are not filled by an opaque rectangular BrowserWindow surface.
    this.window.setBackgroundColor('#00000000');
    this.window.webContents.send('pre-mode-changed', 'window');
  }

  private continueSetWindowModeWindow(): void {
    if (!this.window) return;
    if (this.windowMaximized) {
      const display = screen.getDisplayMatching(this.windowedBounds || this.window.getBounds());
      this.window.setBounds(display.workArea);
    } else if (this.windowedBounds) {
      this.window.setBounds(this.windowedBounds);
    } else {
      this.window.setSize(900, 670);
      this.window.center();
    }
    this.restoreMaximized = false;

    if (isMac) {
      this.window.setWindowButtonVisibility(true);
      this.window.setVisibleOnAllWorkspaces(false, {
        visibleOnFullScreen: false,
      });
    }

    this.window?.setIgnoreMouseEvents(false, { forward: true });

    this.window.webContents.send('mode-changed', 'window');
    this.window.setSkipTaskbar(false);
  }

  private setWindowModePet(): void {
    if (!this.window) return;

    if (!this.isWindowMaximized() && !this.restoreMaximized) {
      this.windowedBounds = this.window.getBounds();
      this.persistWindowState(false);
    }

    if (this.window.isFullScreen()) {
      this.window.setFullScreen(false);
    }

    this.window.setBackgroundColor('#00000000');

    this.window.setAlwaysOnTop(true, 'screen-saver');
    this.window.setPosition(0, 0);

    this.window.webContents.send('pre-mode-changed', 'pet');
  }

  private continueSetWindowModePet(): void {
    if (!this.window) return;
    // Calculate the bounding rectangle that covers all connected displays.
    // This allows the transparent pet-mode window to span across monitors,
    // so the avatar can be dragged freely between them.
    const displays = screen.getAllDisplays();
    const minX = Math.min(...displays.map((d) => d.bounds.x));
    const minY = Math.min(...displays.map((d) => d.bounds.y));
    const maxX = Math.max(...displays.map((d) => d.bounds.x + d.bounds.width));
    const maxY = Math.max(...displays.map((d) => d.bounds.y + d.bounds.height));
    const combinedWidth = maxX - minX;
    const combinedHeight = maxY - minY;

    // Resize and position the window to cover the entire virtual screen
    // so the avatar is not clipped when dragged to a second monitor.
    this.window.setBounds({
      x: minX,
      y: minY,
      width: combinedWidth,
      height: combinedHeight,
    });

    if (isMac) this.window.setWindowButtonVisibility(false);
    this.window.setResizable(false);
    this.window.setSkipTaskbar(true);
    this.window.setFocusable(false);

    if (isMac) {
      this.window.setIgnoreMouseEvents(true);
      this.window.setVisibleOnAllWorkspaces(true, {
        visibleOnFullScreen: true,
      });
    } else {
      this.window.setIgnoreMouseEvents(true, { forward: true });
    }

    this.window.webContents.send('mode-changed', 'pet');
    this.window.setSkipTaskbar(true);
  }
  
  getWindow(): BrowserWindow | null {
    return this.window;
  }

  showWindow(): void {
    if (!this.window || this.window.isDestroyed()) return;
    this.window.setSkipTaskbar(this.currentMode === 'pet');
    this.window.show();
    if (this.currentMode === 'window') this.window.focus();
  }

  minimizeWindow(): void {
    if (!this.window || this.window.isDestroyed()) return;
    if (this.currentMode === 'window') this.window.setSkipTaskbar(false);
    this.window.minimize();
  }

  hideToTray(): void {
    if (!this.window || this.window.isDestroyed()) return;
    this.window.hide();
    // A hidden window should never leave a stale taskbar button behind.
    this.window.setSkipTaskbar(true);
  }

  setIgnoreMouseEvents(ignore: boolean): void {
    if (!this.window) return;

    if (isMac) {
      this.window.setIgnoreMouseEvents(ignore);
      // this.window.setIgnoreMouseEvents(ignore, { forward: true });
    } else {
      this.window.setIgnoreMouseEvents(ignore, { forward: true });
    }
  }

  maximizeWindow(): void {
    if (!this.window) return;

    if (this.isWindowMaximized()) {
      if (this.windowedBounds) {
        this.windowMaximized = false;
        this.window.setBounds(this.windowedBounds);
        this.persistWindowState(false);
        this.window.webContents.send('window-maximized-change', false);
      }
    } else {
      this.windowedBounds = this.window.getBounds();
      this.windowMaximized = true;
      const display = screen.getDisplayMatching(this.windowedBounds);
      this.window.setBounds(display.workArea);
      this.persistWindowState(true);
      this.window.webContents.send('window-maximized-change', true);
    }
  }

  isWindowMaximized(): boolean {
    if (!this.window) return false;
    const bounds = this.window.getBounds();
    const { workArea } = screen.getDisplayMatching(bounds);
    return bounds.x <= workArea.x
      && bounds.y <= workArea.y
      && bounds.width >= workArea.width
      && bounds.height >= workArea.height;
  }

  setForceIgnoreMouse(forceIgnore: boolean): void {
    if (this.forceIgnoreMouse === forceIgnore) {
      if (forceIgnore) this.setIgnoreMouseEvents(true);
      return;
    }
    this.toggleForceIgnoreMouse();
  }

  updateComponentHover(componentId: string, isHovering: boolean): void {
    if (this.currentMode === 'window') return;

    // If force ignore is enabled, don't change the mouse ignore state
    if (this.forceIgnoreMouse) return;

    if (isHovering) {
      this.hoveringComponents.add(componentId);
    } else {
      this.hoveringComponents.delete(componentId);
    }

    if (this.window) {
      const shouldIgnore = this.hoveringComponents.size === 0;
      if (isMac) {
        this.window.setIgnoreMouseEvents(shouldIgnore);
      } else {
        this.window.setIgnoreMouseEvents(shouldIgnore, { forward: true });
      }
      if (!shouldIgnore) {
        this.window.setFocusable(true);
      }
    }
  }

  // Toggle force ignore mouse events
  toggleForceIgnoreMouse(): void {
    this.forceIgnoreMouse = !this.forceIgnoreMouse;

    // Apply the new setting immediately
    if (this.forceIgnoreMouse) {
      if (isMac) {
        this.window?.setIgnoreMouseEvents(true);
      } else {
        this.window?.setIgnoreMouseEvents(true, { forward: true });
      }
    } else {
      // Reapply normal behavior based on hovering components
      const shouldIgnore = this.hoveringComponents.size === 0;
      if (isMac) {
        this.window?.setIgnoreMouseEvents(shouldIgnore);
      } else {
        this.window?.setIgnoreMouseEvents(shouldIgnore, { forward: true });
      }
    }

    // Notify renderer about the change
    this.window?.webContents.send('force-ignore-mouse-changed', this.forceIgnoreMouse);
  }

  // Get current force ignore state
  isForceIgnoreMouse(): boolean {
    return this.forceIgnoreMouse;
  }

  // Get current mode
  getCurrentMode(): 'window' | 'pet' {
    return this.currentMode;
  }
}
