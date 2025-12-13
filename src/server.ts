/**
 * Buffett Development Server
 *
 * WebSocket server for the Buffett trading agent demo.
 */

import { config } from "dotenv";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { BuffettAgent } from "./agent.js";

// Get __dirname equivalent in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from .env file
const envPath = resolve(__dirname, "../.env");
config({ path: envPath });

async function startServer() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  const baseUrl = process.env.ANTHROPIC_BASE_URL;
  const model = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-20250514";

  if (!apiKey) {
    console.error("Error: ANTHROPIC_API_KEY is not set");
    console.log("\nPlease set your API key:");
    console.log("  1. Copy .env.example to .env");
    console.log("  2. Fill in your ANTHROPIC_API_KEY");
    process.exit(1);
  }

  const PORT = parseInt(process.env.PORT || "5800", 10);
  const AGENTX_DIR = process.env.AGENTX_DIR || resolve(__dirname, "../.agentx");

  console.log("Starting Buffett Agent Server...\n");
  console.log("Configuration:");
  console.log(`  API Key: ${apiKey.substring(0, 15)}...`);
  console.log(`  Model: ${model}`);
  if (baseUrl) {
    console.log(`  Base URL: ${baseUrl}`);
  }
  console.log(`  Port: ${PORT}`);
  console.log(`  AgentX Directory: ${AGENTX_DIR}`);
  console.log();

  // Import and create AgentX instance
  const { createAgentX } = await import("agentxjs");

  const agentx = await createAgentX({
    llm: {
      apiKey,
      baseUrl,
      model,
    },
    logger: {
      level: "info",
    },
    agentxDir: AGENTX_DIR,
    defaultAgent: BuffettAgent,
  });

  // Create default container
  try {
    console.log("Creating default container...");
    await agentx.request("container_create_request", {
      containerId: "default",
    });
    console.log("✓ Default container ready");
  } catch (error) {
    console.error("Failed to create default container:", error);
    process.exit(1);
  }

  console.log(`✓ Agent configured: ${BuffettAgent.name}`);
  console.log(
    `  - MCP Servers: ${Object.keys(BuffettAgent.mcpServers || {}).join(", ") || "none"}`
  );

  // Start WebSocket server
  await agentx.listen(PORT);

  console.log(`\n✓ WebSocket server started on ws://localhost:${PORT}`);
  console.log(`\nReady! Open http://localhost:5173 in your browser.`);

  // Graceful shutdown
  const shutdown = async () => {
    console.log("\nShutting down...");
    await agentx.dispose();
    console.log("Server stopped");
    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

startServer().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});
