import { useState, useEffect, KeyboardEvent } from "react";
import { ResponsiveStudio, useAgentX } from "@agentxjs/ui";

// 检测是否在 Electron 环境中运行
const isElectron = typeof window !== 'undefined' && window.electronAPI !== undefined;

// 预设的快捷网址
const quickLinks = [
  { name: "OKX", url: "https://www.okx.com/zh-hans/trade-spot/btc-usdt" },
  { name: "币安", url: "https://www.binance.com/zh-CN/trade/BTC_USDT" },
  { name: "TradingView", url: "https://cn.tradingview.com/chart/" },
  { name: "CoinGecko", url: "https://www.coingecko.com/zh" },
];

function App() {
  const [browserUrl, setBrowserUrl] = useState("https://www.okx.com/zh-hans/trade-spot/btc-usdt");
  const [inputUrl, setInputUrl] = useState("https://www.okx.com/zh-hans/trade-spot/btc-usdt");

  // WebSocket URL：统一使用 5800 端口
  const wsUrl = `ws://${window.location.hostname}:5800`;
  const agentx = useAgentX(wsUrl);

  // 在 Electron 中监听浏览器 URL 变化
  useEffect(() => {
    if (isElectron) {
      window.electronAPI.onBrowserUrlChanged((url: string) => {
        setBrowserUrl(url);
        setInputUrl(url);
      });

      // 获取初始 URL
      window.electronAPI.browserGetUrl().then((url: string) => {
        if (url) {
          setBrowserUrl(url);
          setInputUrl(url);
        }
      });

      return () => {
        window.electronAPI.removeBrowserUrlListener();
      };
    }
  }, []);

  const handleNavigate = async () => {
    let url = inputUrl.trim();
    if (url && !url.startsWith("http://") && !url.startsWith("https://")) {
      url = "https://" + url;
    }

    if (isElectron) {
      await window.electronAPI.browserNavigate(url);
    }
    setBrowserUrl(url);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleNavigate();
    }
  };

  const handleRefresh = async () => {
    if (isElectron) {
      await window.electronAPI.browserRefresh();
    }
  };

  const handleBack = async () => {
    if (isElectron) {
      await window.electronAPI.browserBack();
    }
  };

  const handleForward = async () => {
    if (isElectron) {
      await window.electronAPI.browserForward();
    }
  };

  const handleOpenDevTools = async () => {
    if (isElectron) {
      await window.electronAPI.browserOpenDevTools();
    }
  };

  if (!agentx) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center text-gray-600">
          <p className="text-lg font-medium mb-2">连接服务器中...</p>
          <p className="text-sm mt-2">请确保服务器正在运行：</p>
          <code className="text-xs bg-gray-200 px-2 py-1 rounded mt-1 block">
            pnpm dev:server
          </code>
        </div>
      </div>
    );
  }

  // Electron 模式：只显示右侧控制面板和 AI 智能体
  if (isElectron) {
    return (
      <div className="h-screen flex flex-col bg-gray-900">
        {/* 浏览器控制栏 */}
        <div className="h-12 flex items-center gap-2 px-3 border-b border-gray-700 bg-gray-800">
          {/* 后退按钮 */}
          <button
            onClick={handleBack}
            className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-all"
            title="后退"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          {/* 前进按钮 */}
          <button
            onClick={handleForward}
            className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-all"
            title="前进"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {/* 刷新按钮 */}
          <button
            onClick={handleRefresh}
            className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-all"
            title="刷新"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>

          {/* 地址栏 */}
          <div className="flex-1 flex items-center bg-gray-700 rounded-lg overflow-hidden">
            <input
              type="text"
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1 px-3 py-1.5 bg-transparent text-white text-sm outline-none placeholder-gray-400"
              placeholder="输入网址..."
            />
            <button
              onClick={handleNavigate}
              className="px-3 py-1.5 text-gray-400 hover:text-white hover:bg-gray-600 transition-all"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </button>
          </div>

          {/* DevTools 按钮 */}
          <button
            onClick={handleOpenDevTools}
            className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-all"
            title="打开 DevTools"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
          </button>
        </div>

        {/* 快捷链接 */}
        <div className="h-9 flex items-center gap-2 px-3 bg-gray-800 border-b border-gray-700">
          {quickLinks.map((link) => (
            <button
              key={link.name}
              onClick={async () => {
                setInputUrl(link.url);
                setBrowserUrl(link.url);
                if (isElectron) {
                  await window.electronAPI.browserNavigate(link.url);
                }
              }}
              className={`px-3 py-1 text-xs rounded transition-all ${
                browserUrl === link.url
                  ? "bg-blue-600 text-white"
                  : "bg-gray-700 text-gray-300 hover:bg-gray-600"
              }`}
            >
              {link.name}
            </button>
          ))}

          {/* CDP 状态指示 */}
          <div className="ml-auto flex items-center gap-2 text-xs text-gray-400">
            <span className="w-2 h-2 rounded-full bg-green-500"></span>
            <span>CDP: 9222</span>
          </div>
        </div>

        {/* AI 智能体 */}
        <div className="flex-1">
          <ResponsiveStudio
            agentx={agentx}
            containerId="default"
            sidebarWidth={200}
            searchable={true}
            inputHeightRatio={0.25}
          />
        </div>
      </div>
    );
  }

  // Web 模式：显示完整界面（带 iframe）
  return (
    <div className="h-screen flex">
      {/* 左侧：提示使用 Electron */}
      <div className="w-1/2 flex flex-col bg-gray-900 border-r border-gray-700">
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <div className="w-16 h-16 mb-6 text-gray-500">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-white mb-3">
            推荐使用桌面应用
          </h2>
          <p className="text-gray-400 mb-6 max-w-md">
            桌面应用内置完整的 Chrome 浏览器，AI 智能体可以通过 CDP 协议控制浏览器执行操作。
          </p>
          <div className="bg-gray-800 rounded-lg p-4 text-left">
            <p className="text-sm text-gray-300 mb-2">运行桌面应用：</p>
            <code className="text-xs text-green-400 bg-gray-900 px-3 py-2 rounded block">
              pnpm dev:electron
            </code>
          </div>
        </div>
      </div>

      {/* 右侧：AI 智能体对话 */}
      <div className="w-1/2">
        <ResponsiveStudio
          agentx={agentx}
          containerId="default"
          sidebarWidth={200}
          searchable={true}
          inputHeightRatio={0.25}
        />
      </div>
    </div>
  );
}

export default App;
