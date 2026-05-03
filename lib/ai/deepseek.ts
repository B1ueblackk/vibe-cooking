/**
 * DeepSeek API client for recipe generation and nutrition estimation.
 * All calls should be made from server-side (API routes) only.
 */

const DEEPSEEK_BASE_URL =
  process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com";
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || "";

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface DeepSeekResponse {
  choices: { message: { content: string } }[];
}

export async function chat(
  messages: ChatMessage[],
  options?: { temperature?: number; maxTokens?: number }
): Promise<string> {
  const res = await fetch(`${DEEPSEEK_BASE_URL}/v1/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
    },
    body: JSON.stringify({
      model: "DeepSeek-V4-Flash",
      messages,
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.maxTokens ?? 2048,
      response_format: { type: "json_object" },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`DeepSeek API error ${res.status}: ${err}`);
  }

  const data: DeepSeekResponse = await res.json();
  return data.choices[0].message.content;
}

export async function chatJSON<T>(
  messages: ChatMessage[],
  options?: { temperature?: number; maxTokens?: number }
): Promise<T> {
  const content = await chat(messages, options);
  return JSON.parse(content) as T;
}
