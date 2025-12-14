import { app, BrowserWindow, BaseWindow, WebContentsView, ipcMain } from 'electron';
import * as path from 'path';

// CDP 远程调试端口，AI 智能体可以通过这个端口控制浏览器
const CDP_PORT = 9222;

let mainWindow: BaseWindow | null = null;
let appView: WebContentsView | null = null;      // 右侧：React 应用
let browserView: WebContentsView | null = null;   // 左侧：内嵌浏览器

// 当前浏览器 URL
let currentBrowserUrl = 'https://www.okx.com/zh-hans/trade-spot/btc-usdt';

function createWindow() {
  // 使用 BaseWindow 以支持多个 WebContentsView
  mainWindow = new BaseWindow({
    width: 1600,
    height: 1000,
    minWidth: 1200,
    minHeight: 700,
    title: 'Buffett - AI 智能交易助手',
  });

  // 创建左侧浏览器视图（内嵌浏览器）
  browserView = new WebContentsView({
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      // 启用 DevTools 协议
      devTools: true,
    }
  });

  // 创建右侧应用视图（React 应用）
  appView = new WebContentsView({
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    }
  });

  // 添加视图到窗口
  mainWindow.contentView.addChildView(browserView);
  mainWindow.contentView.addChildView(appView);

  // 设置初始布局
  updateLayout();

  // 监听窗口大小变化
  mainWindow.on('resize', updateLayout);

  // 加载内容
  const isDev = process.env.NODE_ENV === 'development';

  if (isDev) {
    // 开发模式：加载 Vite 开发服务器
    appView.webContents.loadURL('http://localhost:5173');
    // 打开 React 应用的 DevTools（可选）
    // appView.webContents.openDevTools({ mode: 'detach' });
  } else {
    // 生产模式：加载打包后的文件
    appView.webContents.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  // 加载默认网页到浏览器视图
  browserView.webContents.loadURL(currentBrowserUrl);

  // 监听浏览器导航事件，同步 URL 到 React 应用
  browserView.webContents.on('did-navigate', (_event, url) => {
    currentBrowserUrl = url;
    appView?.webContents.send('browser-url-changed', url);
  });

  browserView.webContents.on('did-navigate-in-page', (_event, url) => {
    currentBrowserUrl = url;
    appView?.webContents.send('browser-url-changed', url);
  });

  // 窗口关闭处理
  mainWindow.on('closed', () => {
    mainWindow = null;
    appView = null;
    browserView = null;
  });
}

// 更新视图布局
function updateLayout() {
  if (!mainWindow || !browserView || !appView) return;

  const { width, height } = mainWindow.getContentBounds();
  const dividerPosition = Math.floor(width * 0.5); // 50% 分割

  // 左侧浏览器视图
  browserView.setBounds({
    x: 0,
    y: 0,
    width: dividerPosition,
    height: height
  });

  // 右侧应用视图
  appView.setBounds({
    x: dividerPosition,
    y: 0,
    width: width - dividerPosition,
    height: height
  });
}

// IPC 处理：导航到指定 URL
ipcMain.handle('browser-navigate', async (_event, url: string) => {
  if (browserView) {
    await browserView.webContents.loadURL(url);
    return { success: true, url };
  }
  return { success: false, error: 'Browser view not available' };
});

// IPC 处理：刷新浏览器
ipcMain.handle('browser-refresh', async () => {
  if (browserView) {
    browserView.webContents.reload();
    return { success: true };
  }
  return { success: false, error: 'Browser view not available' };
});

// IPC 处理：后退
ipcMain.handle('browser-back', async () => {
  if (browserView && browserView.webContents.canGoBack()) {
    browserView.webContents.goBack();
    return { success: true };
  }
  return { success: false, error: 'Cannot go back' };
});

// IPC 处理：前进
ipcMain.handle('browser-forward', async () => {
  if (browserView && browserView.webContents.canGoForward()) {
    browserView.webContents.goForward();
    return { success: true };
  }
  return { success: false, error: 'Cannot go forward' };
});

// IPC 处理：获取当前 URL
ipcMain.handle('browser-get-url', () => {
  return browserView ? browserView.webContents.getURL() : '';
});

// IPC 处理：获取 CDP WebSocket URL
ipcMain.handle('get-cdp-url', () => {
  if (browserView) {
    const debuggerUrl = browserView.webContents.debugger;
    return `ws://127.0.0.1:${CDP_PORT}`;
  }
  return null;
});

// IPC 处理：打开浏览器的 DevTools
ipcMain.handle('browser-open-devtools', () => {
  if (browserView) {
    browserView.webContents.openDevTools({ mode: 'detach' });
    return { success: true };
  }
  return { success: false };
});

// 启动时开启远程调试
app.commandLine.appendSwitch('remote-debugging-port', CDP_PORT.toString());

// 应用准备就绪
app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });

  console.log(`
╔════════════════════════════════════════════════════════════╗
║           Buffett - AI 智能交易助手                        ║
╠════════════════════════════════════════════════════════════╣
║  CDP 远程调试端口: ${CDP_PORT}                                  ║
║  AI 可通过 Chrome DevTools Protocol 控制浏览器             ║
║                                                            ║
║  调试地址: http://127.0.0.1:${CDP_PORT}                         ║
╚════════════════════════════════════════════════════════════╝
  `);
});

// 所有窗口关闭时退出应用（macOS 除外）
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
