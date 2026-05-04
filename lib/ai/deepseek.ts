/**
 * AI client supporting multiple OpenAI-compatible gateways.
 * All calls should be made from server-side (API routes) only.
 *
 * Providers:
 *   - "deepseek" (default): JD Cloud / DeepSeek gateway
 *   - "qwen": api.gpt.ge gateway with Qwen model
 */

// ── Provider configs ────────────────────────────────────────────

interface ProviderConfig {
  baseUrl: string;
  apiKey: string;
  model: string;
}

function getProvider(name?: string): ProviderConfig {
  if (name === "qwen") {
    return {
      baseUrl: process.env.QWEN_BASE_URL || "https://api.gpt.ge",
      apiKey: process.env.QWEN_API_KEY || "",
      model: process.env.QWEN_MODEL || "qwen3.5-plus",
    };
  }
  // default: deepseek
  return {
    baseUrl: process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com",
    apiKey: process.env.DEEPSEEK_API_KEY || "",
    model: process.env.DEEPSEEK_MODEL || "deepseek-v4-flash",
  };
}

// ── Types ───────────────────────────────────────────────────────

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface ChatCompletionResponse {
  choices: { message: { content: string; reasoning_content?: string } }[];
}

export interface ChatOptions {
  temperature?: number;
  maxTokens?: number;
  /** Which AI provider to use: "deepseek" (default) | "qwen" */
  provider?: "deepseek" | "qwen";
}

// ── Core functions ──────────────────────────────────────────────

export async function chat(
  messages: ChatMessage[],
  options?: ChatOptions,
): Promise<string> {
  const cfg = getProvider(options?.provider);
  const startTime = Date.now();
  console.log(`[AI] Request → ${cfg.model} | provider=${options?.provider ?? "deepseek"} | messages=${messages.length}`);

  const res = await fetch(`${cfg.baseUrl}/v1/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${cfg.apiKey}`,
    },
    body: JSON.stringify({
      model: cfg.model,
      messages,
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.maxTokens ?? 16384,
      response_format: { type: "json_object" },
    }),
  });

  const elapsed = Date.now() - startTime;

  if (!res.ok) {
    const err = await res.text();
    console.error(`[AI] Error ← ${cfg.model} | ${res.status} | ${elapsed}ms | ${err.slice(0, 200)}`);
    throw new Error(`AI API error (${cfg.model}) ${res.status}: ${err}`);
  }

  const data: ChatCompletionResponse = await res.json();
  const msg = data.choices[0].message;
  const content = msg.content || "";
  const reasoning = msg.reasoning_content || "";
  console.log(`[AI] Response ← ${cfg.model} | ${elapsed}ms | content=${content.length} chars | reasoning=${reasoning.length} chars`);
  // Prefer content (the actual output); fall back to reasoning_content for reasoning-only models
  return content || reasoning;
}

export async function chatJSON<T>(
  messages: ChatMessage[],
  options?: ChatOptions,
): Promise<T> {
  const content = await chat(messages, options);
  try {
    return JSON.parse(content) as T;
  } catch {
    // Try to extract JSON from markdown code blocks or partial response
    const match = content.match(/```(?:json)?\s*([\s\S]*?)```/) || content.match(/(\{[\s\S]*\})/);
    if (match) {
      try {
        return JSON.parse(match[1]) as T;
      } catch {
        // fall through
      }
    }
    console.error(`[AI] JSON parse failed. First 500 chars: ${content.slice(0, 500)}`);
    console.error(`[AI] Last 500 chars: ${content.slice(-500)}`);
    throw new Error(`AI 返回格式错误，无法解析 JSON。响应长度: ${content.length} 字符`);
  }
}
