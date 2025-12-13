import { useState } from "react";
import { Allotment } from "allotment";
import { ResponsiveStudio, useAgentX } from "@agentxjs/ui";
import "allotment/dist/style.css";

// PPT 幻灯片配置
const slides = [
  { src: "/slides/1_AI.png", title: "巴菲特AI - 对话式智能炒股助手" },
  { src: "/slides/2_.png", title: "第 2 页" },
  { src: "/slides/3_.png", title: "第 3 页" },
  { src: "/slides/4_.png", title: "第 4 页" },
  { src: "/slides/5_.png", title: "第 5 页" },
  { src: "/slides/6_.png", title: "第 6 页" },
  { src: "/slides/7_AgentX-PromptX.png", title: "AgentX + PromptX" },
  { src: "/slides/8_.png", title: "第 8 页" },
  { src: "/slides/9_.png", title: "第 9 页" },
  { src: "/slides/10_.png", title: "第 10 页" },
  { src: "/slides/11_.png", title: "第 11 页" },
];

function App() {
  const [currentSlide, setCurrentSlide] = useState(0);

  // WebSocket URL：统一使用 5800 端口
  const wsUrl = `ws://${window.location.hostname}:5800`;
  const agentx = useAgentX(wsUrl);

  const prevSlide = () => setCurrentSlide((prev) => (prev > 0 ? prev - 1 : slides.length - 1));
  const nextSlide = () => setCurrentSlide((prev) => (prev < slides.length - 1 ? prev + 1 : 0));

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
        {/* 左侧：PPT 展示区 */}
        <Allotment.Pane minSize={300} preferredSize="50%">
          <div className="h-full flex flex-col bg-gray-900">
            {/* 顶部标题栏 */}
            <div className="h-14 flex items-center justify-between px-6 border-b border-gray-700 bg-gray-800">
              <h2 className="text-lg font-semibold text-white">
                演示文稿
              </h2>
              <span className="text-sm text-gray-400">
                {currentSlide + 1} / {slides.length}
              </span>
            </div>

            {/* PPT 内容区 */}
            <div className="flex-1 flex items-center justify-center p-4 relative">
              {slides.length > 0 ? (
                <>
                  <img
                    src={slides[currentSlide].src}
                    alt={slides[currentSlide].title}
                    className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'%3E%3Crect fill='%23374151' width='400' height='300'/%3E%3Ctext fill='%239CA3AF' font-family='sans-serif' font-size='16' x='50%25' y='50%25' text-anchor='middle'%3E将 PPT 图片放入 public/slides/%3C/text%3E%3C/svg%3E";
                    }}
                  />

                  {/* 左箭头 */}
                  <button
                    onClick={prevSlide}
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center bg-black/50 hover:bg-black/70 text-white rounded-full transition-all"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>

                  {/* 右箭头 */}
                  <button
                    onClick={nextSlide}
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center bg-black/50 hover:bg-black/70 text-white rounded-full transition-all"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </>
              ) : (
                <p className="text-gray-500">暂无幻灯片</p>
              )}
            </div>

            {/* 底部缩略图导航 */}
            <div className="h-20 flex items-center justify-center gap-2 px-4 bg-gray-800 border-t border-gray-700 overflow-x-auto">
              {slides.map((slide, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentSlide(index)}
                  className={`flex-shrink-0 w-16 h-12 rounded border-2 overflow-hidden transition-all ${
                    index === currentSlide
                      ? "border-blue-500 ring-2 ring-blue-500/50"
                      : "border-gray-600 hover:border-gray-500"
                  }`}
                >
                  <img
                    src={slide.src}
                    alt={slide.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                </button>
              ))}
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
