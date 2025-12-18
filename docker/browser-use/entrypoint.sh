#!/bin/bash
set -e

# 清理旧的 X lock 文件
rm -f /tmp/.X99-lock /tmp/.X11-unix/X99 2>/dev/null || true

# 启动虚拟显示器
echo "Starting Xvfb..."
Xvfb :99 -screen 0 1920x1080x24 &
XVFB_PID=$!
sleep 2

# 检查 Xvfb 是否启动成功
if ! kill -0 $XVFB_PID 2>/dev/null; then
    echo "Failed to start Xvfb, retrying..."
    rm -f /tmp/.X99-lock /tmp/.X11-unix/X99 2>/dev/null || true
    Xvfb :99 -screen 0 1920x1080x24 &
    sleep 2
fi

# 启动窗口管理器
echo "Starting Fluxbox..."
fluxbox &
sleep 1

# 启动 VNC 服务器
echo "Starting VNC server on port 5900..."
x11vnc -display :99 -forever -shared -rfbport 5900 -passwd ${VNC_PASSWORD:-browser-use} -noxdamage &

# 等待 VNC 启动
sleep 2

echo "============================================"
echo "  Browser-Use MCP Server"
echo "============================================"
echo "  MCP Server: http://0.0.0.0:8000/sse"
echo "  VNC Server: vnc://localhost:5900"
echo "  VNC Password: ${VNC_PASSWORD:-browser-use}"
echo "  Browser Data: /app/browser-data"
echo "============================================"

# 启动 mcp-server-browser-use
# 使用 SSE 模式，支持持久化浏览器数据
exec mcp-server-browser-use --sse-port 8000 --sse-host 0.0.0.0
