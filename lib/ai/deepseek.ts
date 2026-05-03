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
  choices: { message: { content: string } }[];
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
      max_tokens: options?.maxTokens ?? 2048,
      response_format: { type: "json_object" },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`AI API error (${cfg.model}) ${res.status}: ${err}`);
  }

  const data: ChatCompletionResponse = await res.json();
  return data.choices[0].message.content;
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
    throw new Error(`AI 返回格式错误，无法解析 JSON。响应长度: ${content.length} 字符`);
  }
}
