# 电商智能助手平台

AI驱动的电商运营工具集 - 为服装电商商家提供4个专业智能助手

## 🎯 智能体介绍

| 智能体 | 职责 | 核心能力 |
|--------|------|----------|
| 🎨 **冠华** | 换图助手 | 商品图换背景、换模特、平台适配 |
| 👔 **时尚CEO** | 战略顾问 | 品牌定位、市场分析、经营决策 |
| 🎬 **剪辑大师** | 视频制作 | 短视频脚本、剪辑建议、内容策划 |
| 📝 **种草达人** | 小红书作者 | 爆款文案、种草笔记、标题优化 |

## 🚀 快速开始

### 1. 安装依赖

```bash
pnpm install
```

### 2. 配置API密钥

```bash
cp .env.example .env
# 编辑 .env 文件，添加你的 ANTHROPIC_API_KEY
```

### 3. 启动开发服务器

```bash
# 方式1: 同时启动前后端
pnpm dev:full

# 方式2: 分别启动
# 终端1: 启动WebSocket服务器
pnpm dev:server

# 终端2: 启动Web UI
pnpm dev
```

### 4. 打开浏览器

访问 http://localhost:5173

### 5. 登录

使用演示账户登录:
- 用户名: `demo`
- 密码: `demo123`

## 📁 项目结构

```
电商智能助手/
├── src/
│   ├── agent.ts          # 4个智能体定义
│   ├── server.ts         # WebSocket + Vision API 服务器
│   ├── vision-api.ts     # Claude Vision API 集成
│   └── web/
│       ├── App.tsx       # 前端主应用（登录+侧边栏+对话）
│       ├── main.tsx      # React入口
│       └── index.css     # 样式
├── docs/
│   └── adr/
│       └── 001-ecommerce-agent-architecture.md  # 架构设计文档
├── index.html
├── package.json
├── vite.config.ts
└── .env.example
```

## ✨ 功能特性

### 用户系统
- ✅ 预设账户登录（支持15-20个内部用户）
- ✅ 会话持久化（localStorage）
- ✅ 按用户隔离对话和数据

### 智能体系统
- ✅ 4个专业电商智能体
- ✅ 对话-智能体绑定机制
- ✅ 新建对话时选择智能体
- ✅ PromptX MCP 工具集成

### UI功能
- ✅ 登录页面
- ✅ 侧边栏对话列表
- ✅ 新建对话弹窗
- ✅ AgentX UI Chat组件
- ✅ 对话删除功能

### 换图工作流（冠华）
- ✅ Vision API 图片分析
- ✅ 提示词组装
- ✅ 图片生成（Gemini）

## 🛠️ 技术栈

- **前端**: React 18 + TypeScript + Vite
- **UI框架**: AgentX UI + Tailwind CSS
- **后端**: AgentX Runtime + WebSocket
- **AI**: Claude (Anthropic) + PromptX MCP
- **图像**: Claude Vision API + Gemini

## 📖 预设账户

```typescript
demo / demo123        # 演示账户
admin / admin123      # 管理员
user1 / pass001       # 用户1
user2 / pass002       # 用户2
user3 / pass003       # 用户3
// ... 可扩展至20个
```

## 🔧 环境变量

```bash
# .env 文件配置
ANTHROPIC_API_KEY=your_api_key_here
ANTHROPIC_MODEL=claude-sonnet-4-20250514
PORT=5800                    # WebSocket 端口
API_PORT=5801                # Vision API 端口
```

## 📦 生产部署

```bash
# 构建
pnpm build

# Docker部署
docker-compose up -d
```

## 📚 文档

- [架构设计文档](./docs/adr/001-ecommerce-agent-architecture.md)
- [AgentX文档](https://agentx.dev)
- [PromptX文档](https://github.com/Deepractice/PromptX)

## 🎯 使用场景

### 场景1: 商品换图
1. 登录并选择"冠华"智能体
2. 上传商品图片
3. 描述需求（换背景/换模特等）
4. 获得优化后的图片

### 场景2: 品牌咨询
1. 选择"时尚CEO"智能体
2. 描述品牌现状和困惑
3. 获得战略建议

### 场景3: 视频制作
1. 选择"剪辑大师"智能体
2. 描述视频创意
3. 获得脚本和剪辑建议

### 场景4: 小红书文案
1. 选择"种草达人"智能体
2. 上传商品图或描述
3. 获得爆款文案

## 🤝 贡献

欢迎贡献代码、报告问题或提出建议！

## 📄 许可

MIT License
