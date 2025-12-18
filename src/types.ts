/**
 * 电商智能助手平台 - 类型定义
 */

/**
 * 预设用户账户
 */
export interface PresetUser {
  userId: string;
  username: string;
  password: string;
  displayName: string;
}

/**
 * 智能体类型
 */
export type AgentType = "guanhua" | "fashion-ceo" | "video-master" | "xiaohongshu-writer";

/**
 * 智能体信息
 */
export interface AgentInfo {
  id: AgentType;
  name: string;
  description: string;
  icon: string;
  color: string;
}

/**
 * 对话元数据
 */
export interface ConversationMetadata {
  agentType: AgentType;
  createdAt: number;
  title?: string;
}

/**
 * 对话项（AgentX Image对象扩展）
 */
export interface Conversation {
  imageId: string;
  name: string;
  agentType: AgentType;
  createdAt: number;
  metadata?: ConversationMetadata;
}

/**
 * Vision API 请求
 */
export interface VisionAnalyzeRequest {
  images: Array<{
    type: "url" | "base64";
    source: string;
  }>;
  prompt?: string;
  maxTokens?: number;
}

/**
 * Vision API 响应
 */
export interface VisionAnalyzeResponse {
  success: boolean;
  data?: {
    analysis: string;
    confidence?: number;
  };
  error?: string;
}

/**
 * WebSocket连接状态
 */
export type ConnectionStatus = "connecting" | "connected" | "disconnected" | "error";

/**
 * 用户会话
 */
export interface UserSession {
  userId: string;
  username: string;
  displayName: string;
  authToken: string;
  loginTime: number;
}
