import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { HttpServerTransport } from "@modelcontextprotocol/sdk/server/http.js";
import { z } from "zod";
import fetch from "node-fetch";
import dotenv from "dotenv";
dotenv.config();

const GAMMA_API_URL = "https://api.gamma.app/public-api/v0.1/generate";
const GAMMA_API_KEY = process.env.GAMMA_API_KEY;

// Helper function for Gamma API
async function generatePresentation(
  params: Record<string, any>
): Promise<{ url: string | null; error: string | null }> {
  try {
    const response = await fetch(GAMMA_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-KEY": GAMMA_API_KEY || "",
      },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
    }

    const data = (await response.json()) as { url?: string };
    return { url: data.url || null, error: null };
  } catch (error: any) {
    console.error("Error making Gamma API request:", error);
    return { url: null, error: error.message || String(error) };
  }
}

async function main() {
  const port = process.env.PORT || 8080;

  const transport = new HttpServerTransport({
    port,
    auth: false, // disable auth for now
  });

  const server = new McpServer({
    name: "gamma-presentation",
    version: "1.0.0",
    capabilities: {
      resources: {},
      tools: {},
    },
  });

  // Register the tool
  server.tool(
    "generate-presentation",
    "Generate a presentation using the Gamma API. Returns a link to the presentation.",
    {
      inputText: z.string().describe("The topic or prompt for the presentation."),
      tone: z.string().optional().describe("Tone of the presentation."),
      audience: z.string().optional().describe("Intended audience."),
      textAmount: z.enum(["short", "medium", "long"]).optional(),
      textMode: z.enum(["generate", "summarize"]).optional(),
      numCards: z.number().min(1).max(20).optional(),
      imageModel: z.string().optional(),
      imageStyle: z.string().optional(),
      editorMode: z.string().optional(),
      additionalInstructions: z.string().optional(),
    },
    async (params) => {
      const { url, error } = await generatePresentation(params);
      if (!url) {
        return {
          content: [
            {
              type: "text",
              text: `❌ Failed to generate presentation: ${error || "Unknown error."}`,
            },
          ],
        };
      }
      return {
        content: [
          {
            type: "text",
            text: `✅ Presentation generated! View it here: ${url}`,
          },
        ],
      };
    }
  );

  await server.connect(transport);
  console.log(`Gamma MCP Server listening on port ${port}`);
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
