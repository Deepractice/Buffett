/**
 * 电商智能助手后端服务器 (Server)
 * 
 * 架构说明:
 * 1. 核心服务: AgentX WebSocket Server (端口 5800)
 * 2. 静态服务: Production模式下托管前端构建产物
 * 3. 智能体: 加载 4 个核心电商 Agent (冠华, 时尚CEO, 剪辑大师, 种草达人)
 */

import { config } from "dotenv";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { createServer } from "http";
import { readFileSync, existsSync } from "fs";
import { GuanhuaAgent } from "./agent.js"; // 默认加载冠华，其他Agent通过前端选择动态激活

// 环境初始化
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envPath = resolve(__dirname, "../.env");
config({ path: envPath });

async function startServer() {
  console.log("🚀 正在启动电商智能助手服务...");

  // 1. 检查环境变量
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error("❌ 错误: 未设置 ANTHROPIC_API_KEY");
    process.exit(1);
  }

  // 2. 配置参数
  const PORT = parseInt(process.env.PORT || "5800", 10);
  const AGENTX_DIR = process.env.AGENTX_DIR || resolve(__dirname, "../.agentx");
  const model = process.env.ANTHROPIC_MODEL || "claude-3-5-sonnet-20240620";

  // 3. 初始化 AgentX
  const { createAgentX } = await import("agentxjs");
  
  const agentx = await createAgentX({
    llm: {
      apiKey,
      model,
    },
    logger: {
      level: "info",
    },
    agentxDir: AGENTX_DIR,
    defaultAgent: GuanhuaAgent, // 设置默认 Agent
    // 注意: AgentX 会根据前端传递的 systemPrompt 动态切换角色行为
    // 所以我们不需要在这里硬编码所有 Agent 的路由，只要 DefaultAgent 能承载连接即可
  } as any);

  // 4. 启动 WebSocket 服务
  await agentx.listen(PORT);
  console.log(`✅ WebSocket 服务已启动: ws://localhost:${PORT}`);

  // 5. (可选) 生产环境静态文件服务
  // 开发环境下 Vite 会处理这个，只有 build 后才需要
  const isProduction = process.env.NODE_ENV === "production";
  if (isProduction) {
    const distDir = resolve(__dirname, "../dist");
    if (existsSync(distDir)) {
      const HTTP_PORT = parseInt(process.env.HTTP_PORT || "80", 10);
      
      const httpServer = createServer((req, res) => {
        // 简单的 SPA 静态文件服务逻辑
        let filePath = resolve(distDir, req.url === '/' ? 'index.html' : req.url!.slice(1));
        if (!existsSync(filePath)) filePath = resolve(distDir, 'index.html');
        
        try {
          const content = readFileSync(filePath);
          // 简单 MIME 处理 (生产环境建议用 Nginx)
          const ext = filePath.split('.').pop();
          const map: any = { html: 'text/html', js: 'application/javascript', css: 'text/css' };
          res.writeHead(200, { 'Content-Type': map[ext!] || 'text/plain' });
          res.end(content);
        } catch {
          res.writeHead(404);
          res.end();
        }
      });

      httpServer.listen(HTTP_PORT, '0.0.0.0', () => {
        console.log(`✅ Web 服务已启动: http://localhost:${HTTP_PORT}`);
      });
    }
  }

  // 优雅退出
  const shutdown = async () => {
    await agentx.dispose();
    process.exit(0);
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

startServer().catch(err => {
  console.error("启动失败:", err);
  process.exit(1);
});