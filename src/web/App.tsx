import { useState, KeyboardEvent } from "react";
import { Allotment } from "allotment";
import { ResponsiveStudio, useAgentX } from "@agentxjs/ui";
import "allotment/dist/style.css";

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

  const handleNavigate = () => {
    let url = inputUrl.trim();
    if (url && !url.startsWith("http://") && !url.startsWith("https://")) {
      url = "https://" + url;
    }
    setBrowserUrl(url);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleNavigate();
    }
  };

  const handleRefresh = () => {
    setBrowserUrl("");
    setTimeout(() => setBrowserUrl(inputUrl), 50);
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

  return (
    <div className="h-screen">
      <Allotment>
        {/* 左侧：内嵌浏览器 */}
        <Allotment.Pane minSize={300} preferredSize="50%">
          <div className="h-full flex flex-col bg-gray-900">
            {/* 浏览器工具栏 */}
            <div className="h-14 flex items-center gap-2 px-3 border-b border-gray-700 bg-gray-800">
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
            </div>

            {/* 快捷链接 */}
            <div className="h-10 flex items-center gap-2 px-3 bg-gray-800 border-b border-gray-700">
              {quickLinks.map((link) => (
                <button
                  key={link.name}
                  onClick={() => {
                    setInputUrl(link.url);
                    setBrowserUrl(link.url);
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
            </div>

            {/* iframe 内容区 */}
            <div className="flex-1 relative bg-gray-950">
              {browserUrl ? (
                <iframe
                  src={browserUrl}
                  className="w-full h-full border-0"
                  allow="fullscreen"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="内嵌浏览器"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-500">
                  <p>请输入网址或选择快捷链接</p>
                </div>
              )}
            </div>
          </div>
        </Allotment.Pane>

        {/* 右侧：AI 智能体对话 */}
        <Allotment.Pane minSize={350}>
          <ResponsiveStudio
            agentx={agentx}
            containerId="default"
            sidebarWidth={200}
            searchable={true}
            inputHeightRatio={0.25}
          />
        </Allotment.Pane>
      </Allotment>
    </div>
  );
}

export default App;
