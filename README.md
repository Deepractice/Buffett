# Buffett

A trading agent built with AgentX and PromptX - Value investing analyst inspired by Warren Buffett.

## Quick Start

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Configure API Key

```bash
cp .env.example .env
# Edit .env and add your ANTHROPIC_API_KEY
```

### 3. Run Development Server

```bash
# Terminal 1: Start WebSocket server
pnpm dev:server

# Terminal 2: Start Web UI
pnpm dev
```

Or run both together:

```bash
pnpm dev:full
```

### 4. Open Browser

Visit http://localhost:5173

## Project Structure

```
Buffett/
├── src/
│   ├── agent.ts          # Buffett Agent definition
│   ├── server.ts         # WebSocket server
│   └── web/
│       ├── App.tsx       # Main layout (dual-pane)
│       ├── main.tsx      # React entry
│       └── index.css     # Styles
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── .env.example
```

## Features

- **Dual-pane Layout**: Left side for PPT presentation (reserved), right side for AI chat
- **Value Investing AI**: Buffett-style investment analysis
- **PromptX Integration**: MCP server for enhanced prompts
- **Resizable Panels**: Drag to adjust panel widths

## Built with

- [AgentX](https://github.com/Deepractice/AgentX) - Event-driven AI Agent framework
- [PromptX](https://github.com/Deepractice/PromptX) - Prompt engineering toolkit
