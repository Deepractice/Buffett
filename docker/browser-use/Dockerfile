# Browser-Use MCP Server Dockerfile
# 基于官方 browser-use-mcp-server 构建，添加 VNC 支持和 Cookie 持久化

FROM docker.m.daocloud.io/library/python:3.11-slim

# 设置工作目录
WORKDIR /app

# 🚀 使用清华大学 TUNA 镜像源加速 apt 下载
RUN sed -i 's|deb.debian.org|mirrors.tuna.tsinghua.edu.cn|g' /etc/apt/sources.list.d/debian.sources && \
    sed -i 's|security.debian.org|mirrors.tuna.tsinghua.edu.cn|g' /etc/apt/sources.list.d/debian.sources

# 🚀 配置 pip 使用清华大学镜像源
RUN pip config set global.index-url https://pypi.tuna.tsinghua.edu.cn/simple/ && \
    pip config set global.trusted-host pypi.tuna.tsinghua.edu.cn

# 安装系统依赖
RUN apt-get update && apt-get install -y \
    # Playwright 依赖
    libnss3 \
    libnspr4 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libcups2 \
    libdrm2 \
    libxkbcommon0 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxrandr2 \
    libgbm1 \
    libasound2 \
    libpango-1.0-0 \
    libcairo2 \
    # VNC 相关
    x11vnc \
    xvfb \
    fluxbox \
    # 工具
    curl \
    git \
    && rm -rf /var/lib/apt/lists/*

# 安装 uv (快速 Python 包管理器)
RUN curl -LsSf https://astral.sh/uv/install.sh | sh
ENV PATH="/root/.local/bin:$PATH"

# 安装 mcp-server-browser-use (正确的包名)
RUN uv pip install --system mcp-server-browser-use

# 安装 Playwright 浏览器
RUN uv pip install --system playwright && \
    playwright install chromium && \
    playwright install-deps chromium

# 创建浏览器数据目录
RUN mkdir -p /app/browser-data

# 设置环境变量
ENV DISPLAY=:99
ENV BROWSER_DATA_DIR=/app/browser-data

# VNC 启动脚本
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# 暴露端口
# 8000: MCP Server (SSE)
# 5900: VNC
EXPOSE 8000 5900

ENTRYPOINT ["/entrypoint.sh"]
