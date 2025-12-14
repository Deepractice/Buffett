import { contextBridge, ipcRenderer } from 'electron';

// 暴露安全的 API 给渲染进程
contextBridge.exposeInMainWorld('electronAPI', {
  // 浏览器控制
  browserNavigate: (url: string) => ipcRenderer.invoke('browser-navigate', url),
  browserRefresh: () => ipcRenderer.invoke('browser-refresh'),
  browserBack: () => ipcRenderer.invoke('browser-back'),
  browserForward: () => ipcRenderer.invoke('browser-forward'),
  browserGetUrl: () => ipcRenderer.invoke('browser-get-url'),
  browserOpenDevTools: () => ipcRenderer.invoke('browser-open-devtools'),

  // CDP 相关
  getCdpUrl: () => ipcRenderer.invoke('get-cdp-url'),

  // 监听 URL 变化
  onBrowserUrlChanged: (callback: (url: string) => void) => {
    ipcRenderer.on('browser-url-changed', (_event, url) => callback(url));
  },

  // 移除监听
  removeBrowserUrlListener: () => {
    ipcRenderer.removeAllListeners('browser-url-changed');
  }
});

// TypeScript 类型声明
declare global {
  interface Window {
    electronAPI: {
      browserNavigate: (url: string) => Promise<{ success: boolean; url?: string; error?: string }>;
      browserRefresh: () => Promise<{ success: boolean; error?: string }>;
      browserBack: () => Promise<{ success: boolean; error?: string }>;
      browserForward: () => Promise<{ success: boolean; error?: string }>;
      browserGetUrl: () => Promise<string>;
      browserOpenDevTools: () => Promise<{ success: boolean }>;
      getCdpUrl: () => Promise<string | null>;
      onBrowserUrlChanged: (callback: (url: string) => void) => void;
      removeBrowserUrlListener: () => void;
    };
  }
}
