import { ChatOpenAI } from "@langchain/openai";
import { getEnv } from "../config/env.js";

export function createChatModel(): ChatOpenAI {
  const env = getEnv();

  return new ChatOpenAI({
    model: env.OPENROUTER_MODEL,
    apiKey: env.OPENROUTER_API_KEY,
    configuration: {
      baseURL: env.OPENROUTER_BASE_URL
    }
  });
}
