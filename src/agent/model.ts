import { ChatOpenAI } from "@langchain/openai";
import { getModelEnv } from "../config/env.js";

export function createChatModel(): ChatOpenAI {
  const env = getModelEnv();

  return new ChatOpenAI({
    model: env.OPENROUTER_MODEL,
    apiKey: env.OPENROUTER_API_KEY,
    configuration: {
      baseURL: env.OPENROUTER_BASE_URL
    }
  });
}
