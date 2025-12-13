import { Allotment } from "allotment";
import { ResponsiveStudio, useAgentX } from "@agentxjs/ui";
import "allotment/dist/style.css";

function App() {
  const agentx = useAgentX("ws://localhost:5200");

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
        {/* 左侧：PPT 展示区（预留） */}
        <Allotment.Pane minSize={300} preferredSize="50%">
          <div className="h-full flex flex-col bg-gray-100">
            {/* 顶部标题栏 */}
            <div className="h-14 flex items-center px-6 border-b border-gray-200 bg-white">
              <h2 className="text-lg font-semibold text-gray-800">
                演示文稿
              </h2>
            </div>

            {/* PPT 内容区 */}
            <div className="flex-1 flex items-center justify-center p-8">
              <div className="text-center">
                <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gray-200 flex items-center justify-center">
                  <svg
                    className="w-12 h-12 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <p className="text-gray-500 text-lg mb-2">PPT 展示区</p>
                <p className="text-gray-400 text-sm">
                  此区域预留用于展示演示文稿
                </p>
              </div>
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
