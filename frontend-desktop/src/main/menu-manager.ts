/* eslint-disable @typescript-eslint/ban-ts-comment */
import {
  Tray, nativeImage, Menu, BrowserWindow, ipcMain, screen, MenuItemConstructorOptions, app,
} from 'electron';
// @ts-expect-error
import trayIcon from '../../resources/icon.png?asset';

export interface ConfigFile {
  filename: string;
  name: string;
}

interface PetMenuStatus {
  micOn?: boolean;
  screenSharing?: boolean;
  mousePassthrough?: boolean;
  scrollToResize?: boolean;
  dialogueVisible?: boolean;
}

export class MenuManager {
  private tray: Tray | null = null;

  private trayMenuWindow: BrowserWindow | null = null;

  private petMenuWindow: BrowserWindow | null = null;

  private petMenuTarget: Electron.WebContents | null = null;

  private petMenuCursorTimer: NodeJS.Timeout | null = null;

  private currentMode: 'window' | 'pet' = 'window';

  private configFiles: ConfigFile[] = [];

  constructor(private onModeChange: (mode: 'window' | 'pet') => void) {
    this.setupContextMenu();
  }

  createTray(): void {
    const icon = nativeImage.createFromPath(trayIcon);
    const trayIconResized = icon.resize({
      width: process.platform === 'win32' ? 16 : 18,
      height: process.platform === 'win32' ? 16 : 18,
    });

    this.tray = new Tray(trayIconResized);
    this.tray.on('right-click', () => this.toggleTrayMenu());
    this.tray.on('click', () => this.toggleTrayMenu());
    this.updateTrayMenu();
  }

  private getMainWindows(): BrowserWindow[] {
    return BrowserWindow.getAllWindows().filter((window) => (
      window !== this.trayMenuWindow && window !== this.petMenuWindow
    ));
  }

  private trayMenuHtml(): string {
    const isPet = this.currentMode === 'pet';
    return `<!doctype html><html lang="zh-CN"><head><meta charset="UTF-8"><style>
      *{box-sizing:border-box}html,body{margin:0;background:transparent;font-family:"Microsoft YaHei UI","Segoe UI",sans-serif;color:#fff5f9;overflow:hidden}
      .menu{margin:7px;padding:9px;width:216px;border-radius:17px;background:linear-gradient(145deg,rgba(51,36,55,.98),rgba(25,21,32,.985));border:1px solid rgba(247,203,220,.32);box-shadow:inset 0 1px rgba(255,245,249,.12);backdrop-filter:blur(22px)}
      .brand{padding:7px 10px 9px;font-size:11px;letter-spacing:.16em;color:rgba(246,207,222,.55)}
      button{width:100%;height:37px;border:0;border-radius:10px;background:transparent;color:rgba(255,239,246,.82);display:flex;align-items:center;gap:10px;padding:0 11px;font-size:13px;text-align:left;cursor:pointer;transition:.16s}
      button:hover{background:rgba(238,181,207,.13);color:#fff}.dot{width:7px;height:7px;border-radius:50%;border:1px solid rgba(246,207,222,.45)}
      button.active .dot{background:#e8b4ca;border-color:#f8d9e6;box-shadow:0 0 8px rgba(232,180,202,.55)}
      .line{height:1px;margin:6px 8px;background:linear-gradient(90deg,transparent,rgba(245,204,220,.18),transparent)}
      .danger:hover{background:rgba(231,113,147,.14);color:#ffdbe6}.shortcut{margin-left:auto;color:rgba(246,207,222,.32);font-size:11px}
    </style></head><body><div class="menu"><div class="brand">爱弥斯 · 桌面助手</div>
      <button class="${isPet ? '' : 'active'}" onclick="send('window')"><span class="dot"></span>窗口模式</button>
      <button class="${isPet ? 'active' : ''}" onclick="send('pet')"><span class="dot"></span>桌宠模式</button>
      ${isPet ? `<button onclick="send('passthrough')"><span class="dot"></span>切换鼠标穿透</button>` : ''}
      <div class="line"></div>
      <button onclick="send('show')">显示窗口<span class="shortcut">SHOW</span></button>
      <button onclick="send('hide')">隐藏窗口<span class="shortcut">HIDE</span></button>
      <div class="line"></div>
      <button class="danger" onclick="send('exit')">退出应用</button>
    </div><script>const {ipcRenderer}=require('electron');function send(action){ipcRenderer.send('tray-menu-action',action)}</script></body></html>`;
  }

  private toggleTrayMenu(): void {
    if (!this.tray) return;
    if (this.trayMenuWindow && !this.trayMenuWindow.isDestroyed()) {
      this.trayMenuWindow.close();
      return;
    }

    const height = this.currentMode === 'pet' ? 306 : 267;
    this.trayMenuWindow = new BrowserWindow({
      width: 230,
      height,
      show: false,
      frame: false,
      transparent: true,
      resizable: false,
      skipTaskbar: true,
      alwaysOnTop: true,
      webPreferences: { nodeIntegration: true, contextIsolation: false },
    });
    const trayBounds = this.tray.getBounds();
    const workArea = screen.getDisplayNearestPoint(screen.getCursorScreenPoint()).workArea;
    const x = Math.max(workArea.x + 8, Math.min(workArea.x + workArea.width - 230, trayBounds.x + trayBounds.width - 230));
    const y = Math.max(workArea.y + 8, trayBounds.y - height - 8);
    this.trayMenuWindow.setPosition(Math.round(x), Math.round(y));
    this.trayMenuWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(this.trayMenuHtml())}`);
    this.trayMenuWindow.once('ready-to-show', () => this.trayMenuWindow?.show());
    this.trayMenuWindow.on('blur', () => this.trayMenuWindow?.close());
    this.trayMenuWindow.on('closed', () => { this.trayMenuWindow = null; });
  }

  private escapeHtml(value: string): string {
    return value.replace(/[&<>"']/g, (char) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    }[char] || char));
  }

  private petMenuHtml(status: PetMenuStatus): string {
    const uniqueConfigs = this.configFiles.filter((config, index, files) => (
      files.findIndex((item) => item.filename === config.filename) === index
    ));
    const characterItems = uniqueConfigs.map((config) => (
      `<button data-action="character:${encodeURIComponent(config.filename)}"><span class="mini"></span>${this.escapeHtml(config.name)}</button>`
    )).join('');
    return `<!doctype html><html lang="zh-CN"><head><meta charset="UTF-8"><style>
      *{box-sizing:border-box}html,body{width:100%;height:100%;margin:0;background:transparent;font-family:"Microsoft YaHei UI","Segoe UI",sans-serif;color:#fff5f9;overflow:hidden}
      .menu{width:100%;height:100%;padding:11px;border-radius:17px;background:linear-gradient(145deg,rgba(51,36,55,.995),rgba(25,21,32,.998));border:1px solid rgba(247,203,220,.24);box-shadow:inset 0 1px rgba(255,245,249,.10);overflow-y:auto;overflow-x:hidden}
      .brand{padding:6px 10px 9px;font-size:11px;letter-spacing:.15em;color:rgba(246,207,222,.52)}
      button{width:100%;height:35px;border:0;border-radius:10px;background:transparent;color:rgba(255,239,246,.84);display:flex;align-items:center;gap:10px;padding:0 11px;font-size:13px;text-align:left;cursor:pointer;transition:.16s}
      button:hover{background:rgba(238,181,207,.13);color:#fff}.icon{width:8px;height:8px;border-radius:3px;border:1px solid rgba(239,190,211,.58);transform:rotate(45deg)}
      .mini{width:5px;height:5px;border-radius:50%;background:rgba(236,185,208,.42);margin-left:2px}.active .icon{background:#e8b4ca;box-shadow:0 0 8px rgba(232,180,202,.5)}
      .line{height:1px;margin:6px 8px;background:linear-gradient(90deg,transparent,rgba(245,204,220,.19),transparent)}
      .section{padding:7px 11px 3px;font-size:10px;letter-spacing:.12em;color:rgba(246,207,222,.38)}.danger:hover{background:rgba(231,113,147,.14);color:#ffdbe6}
      .characters{max-height:108px;overflow:auto}.characters:empty{display:none}::-webkit-scrollbar{width:4px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:rgba(235,182,205,.28);border-radius:9px}
    </style></head><body><div class="menu"><div class="brand">爱弥斯 · 快捷菜单</div>
      <button class="${status.micOn ? 'active' : ''}" data-action="mic"><span class="icon"></span>麦克风 · ${status.micOn ? '开启' : '关闭'}</button>
      <button data-action="interrupt"><span class="icon"></span>打断当前对话</button>
      <button class="${status.screenSharing ? 'active' : ''}" data-action="screen"><span class="icon"></span>屏幕共享 · ${status.screenSharing ? '开启' : '关闭'}</button>
      <button class="${status.dialogueVisible ? 'active' : ''}" data-action="${status.dialogueVisible ? 'hide-dialogue' : 'show-dialogue'}"><span class="icon"></span>对话框 · ${status.dialogueVisible ? '显示' : '隐藏'}</button>
      <div class="line"></div>
      <button class="${status.mousePassthrough ? 'active' : ''}" data-action="passthrough"><span class="icon"></span>鼠标穿透 · ${status.mousePassthrough ? '开启' : '关闭'}</button>
      <button class="${status.scrollToResize ? 'active' : ''}" data-action="scroll"><span class="icon"></span>滚轮缩放 · ${status.scrollToResize ? '开启' : '关闭'}</button>
      <div class="line"></div>
      <button data-action="window"><span class="icon"></span>窗口模式</button>
      <button class="active" data-action="pet"><span class="icon"></span>桌宠模式</button>
      ${characterItems ? `<div class="section">切换角色</div><div class="characters">${characterItems}</div>` : ''}
      <div class="line"></div>
      <button data-action="hide"><span class="icon"></span>隐藏窗口</button>
      <button class="danger" data-action="exit"><span class="icon"></span>退出应用</button>
    </div><script>const{ipcRenderer}=require('electron');document.addEventListener('click',e=>{const b=e.target.closest('button');if(b)ipcRenderer.send('pet-menu-action',b.dataset.action)});document.addEventListener('keydown',e=>{if(e.key==='Escape')ipcRenderer.send('pet-menu-action','close')})</script></body></html>`;
  }

  private showPetMenu(target: Electron.WebContents, status: PetMenuStatus = {}): void {
    this.petMenuWindow?.close();
    this.petMenuTarget = target;
    const parentWindow = BrowserWindow.fromWebContents(target);
    const point = screen.getCursorScreenPoint();
    const area = screen.getDisplayNearestPoint(point).workArea;
    const uniqueCharacterCount = new Set(this.configFiles.map((config) => config.filename)).size;
    const desiredHeight = 473 + Math.min(uniqueCharacterCount, 3) * 35;
    const height = Math.min(desiredHeight, area.height - 16);
    this.petMenuWindow = new BrowserWindow({
      width: 260, height, show: false, frame: false, transparent: true,
      parent: parentWindow || undefined,
      resizable: false, skipTaskbar: true, alwaysOnTop: true,
      webPreferences: { nodeIntegration: true, contextIsolation: false },
    });
    // The pet window itself uses the `screen-saver` level. A regular
    // always-on-top menu can therefore be covered by the dialogue overlay in
    // that parent window. Keep the owned menu at the same native level and
    // explicitly raise it whenever it becomes visible.
    this.petMenuWindow.setAlwaysOnTop(true, 'screen-saver');
    const x = Math.max(area.x + 8, Math.min(point.x, area.x + area.width - 260));
    const y = Math.max(area.y + 8, Math.min(point.y, area.y + area.height - height));
    this.petMenuWindow.setPosition(Math.round(x), Math.round(y));
    this.petMenuWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(this.petMenuHtml(status))}`);
    this.petMenuWindow.once('ready-to-show', () => {
      this.petMenuWindow?.setAlwaysOnTop(true, 'screen-saver');
      this.petMenuWindow?.show();
      this.petMenuWindow?.moveTop();
      this.petMenuWindow?.focus();
      let hasEnteredMenu = false;
      let leftMenuAt = 0;
      this.petMenuCursorTimer = setInterval(() => {
        if (!this.petMenuWindow || this.petMenuWindow.isDestroyed()) return;
        const cursor = screen.getCursorScreenPoint();
        const bounds = this.petMenuWindow.getBounds();
        const inside = cursor.x >= bounds.x
          && cursor.x <= bounds.x + bounds.width
          && cursor.y >= bounds.y
          && cursor.y <= bounds.y + bounds.height;

        if (inside) {
          hasEnteredMenu = true;
          leftMenuAt = 0;
        } else if (hasEnteredMenu) {
          if (!leftMenuAt) leftMenuAt = Date.now();
          if (Date.now() - leftMenuAt >= 450) this.petMenuWindow.close();
        }
      }, 80);
    });
    this.petMenuWindow.on('closed', () => {
      if (this.petMenuCursorTimer) clearInterval(this.petMenuCursorTimer);
      this.petMenuCursorTimer = null;
      this.petMenuWindow = null;
    });
  }

  private getModeMenuItems(): MenuItemConstructorOptions[] {
    // console.log('Getting mode menu items, current mode:', this.currentMode)
    return [
      {
        label: 'Window Mode',
        type: 'radio' as const,
        checked: this.currentMode === 'window',
        click: () => {
          this.setMode('window');
        },
      },
      {
        label: 'Pet Mode',
        type: 'radio' as const,
        checked: this.currentMode === 'pet',
        click: () => {
          this.setMode('pet');
        },
      },
    ];
  }

  private updateTrayMenu(): void {
    if (!this.tray) return;
    this.tray.setToolTip('爱弥斯桌面助手');
    // Keep the native menu detached; Windows does not allow it to inherit the
    // app's colors, so tray clicks open our themed menu window instead.
    this.tray.setContextMenu(null);
  }

  private getContextMenuItems(event: Electron.IpcMainEvent): MenuItemConstructorOptions[] {
    const template: MenuItemConstructorOptions[] = [
      {
        label: 'Toggle Microphone',
        click: () => {
          event.sender.send('mic-toggle');
        },
      },
      {
        label: 'Interrupt',
        click: () => {
          event.sender.send('interrupt');
        },
      },
      { type: 'separator' as const },
      // Only show in pet mode
      ...(this.currentMode === 'pet'
        ? [
          {
            label: 'Toggle Mouse Passthrough',
            click: () => {
              event.sender.send('toggle-force-ignore-mouse');
            },
          },
        ]
        : []),
      {
        label: 'Toggle Scrolling to Resize',
        click: () => {
          event.sender.send('toggle-scroll-to-resize');
        },
      },
      // Only show this item in pet mode
      ...(this.currentMode === 'pet'
        ? [
          {
            label: 'Toggle InputBox and Subtitle',
            click: () => {
              event.sender.send('toggle-input-subtitle');
            },
          },
        ]
        : []),
      { type: 'separator' as const },
      ...this.getModeMenuItems(),
      { type: 'separator' as const },
      {
        label: 'Switch Character',
        visible: this.currentMode === 'pet',
        submenu: this.configFiles.map((config) => ({
          label: config.name,
          click: () => {
            event.sender.send('switch-character', config.filename);
          },
        })),
      },
      { type: 'separator' as const },
      {
        label: 'Hide',
        click: () => {
          const windows = BrowserWindow.getAllWindows();
          windows.forEach((window) => {
            window.hide();
          });
        },
      },
      {
        label: 'Exit',
        click: () => {
          app.quit();
        },
      },
    ];
    return template;
  }

  private setupContextMenu(): void {
    ipcMain.on('tray-menu-action', (_event, action: string) => {
      if (action === 'window' || action === 'pet') this.setMode(action);
      if (action === 'passthrough') this.getMainWindows().forEach((window) => window.webContents.send('toggle-force-ignore-mouse'));
      if (action === 'show') this.getMainWindows().forEach((window) => {
        window.setSkipTaskbar(this.currentMode === 'pet');
        window.show();
        if (this.currentMode === 'window') window.focus();
      });
      if (action === 'hide') this.getMainWindows().forEach((window) => {
        window.hide();
        window.setSkipTaskbar(true);
      });
      if (action === 'exit') app.quit();
      this.trayMenuWindow?.close();
    });
    ipcMain.on('pet-menu-action', (_event, action: string) => {
      const target = this.petMenuTarget;
      if (!target || target.isDestroyed()) return;
      if (action === 'mic') target.send('mic-toggle');
      if (action === 'interrupt') target.send('interrupt');
      if (action === 'screen') target.send('toggle-screen-capture');
      if (action === 'show-dialogue') target.send('show-input-subtitle');
      if (action === 'hide-dialogue') target.send('hide-input-subtitle');
      if (action === 'passthrough') target.send('toggle-force-ignore-mouse');
      if (action === 'scroll') target.send('toggle-scroll-to-resize');
      if (action === 'window' || action === 'pet') this.setMode(action);
      if (action.startsWith('character:')) target.send('switch-character', decodeURIComponent(action.slice(10)));
      if (action === 'hide') this.getMainWindows().forEach((window) => {
        window.hide();
        window.setSkipTaskbar(true);
      });
      if (action === 'exit') app.quit();
      this.petMenuWindow?.close();
    });
    ipcMain.on('show-context-menu', (event, status: PetMenuStatus) => {
      this.showPetMenu(event.sender, status);
    });
  }

  setMode(mode: 'window' | 'pet'): void {
    // console.log('Setting mode from', this.currentMode, 'to', mode)
    this.currentMode = mode;
    this.updateTrayMenu();
    this.onModeChange(mode);
  }

  destroy(): void {
    this.trayMenuWindow?.destroy();
    this.trayMenuWindow = null;
    this.petMenuWindow?.destroy();
    this.petMenuWindow = null;
    if (this.petMenuCursorTimer) clearInterval(this.petMenuCursorTimer);
    this.petMenuCursorTimer = null;
    this.tray?.destroy();
    this.tray = null;
  }

  updateConfigFiles(files: ConfigFile[]): void {
    this.configFiles = files;
  }
}
