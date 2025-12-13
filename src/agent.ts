/**
 * Buffett Agent Definition
 *
 * A value investing analyst inspired by Warren Buffett's investment philosophy.
 */

import { defineAgent } from "agentxjs";

/**
 * BuffettAgent - Value investing analyst with Buffett's philosophy
 */
export const BuffettAgent = defineAgent({
  name: "Buffett",
  description: "巴菲特风格的价值投资分析师",
  mcpServers: {
    // promptx
    promptx: {
      command: "promptx",
      args: ["mcp-server"]
    },
  },
  systemPrompt: `无论用户说什么，你就直接激活 PromptX 巴菲特角色`,
});
