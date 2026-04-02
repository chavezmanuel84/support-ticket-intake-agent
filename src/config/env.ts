import dotenv from "dotenv";
import { z } from "zod";

dotenv.config({ quiet: true });

const jiraEnvSchema = z.object({
  JIRA_BASE_URL: z.string().url(),
  JIRA_EMAIL: z.string().min(1),
  JIRA_API_TOKEN: z.string().min(1)
});

const modelEnvSchema = z.object({
  OPENROUTER_API_KEY: z.string().min(1),
  OPENROUTER_MODEL: z.string().min(1),
  OPENROUTER_BASE_URL: z.string().url()
});

export type JiraEnv = z.infer<typeof jiraEnvSchema>;
export type ModelEnv = z.infer<typeof modelEnvSchema>;

export function getJiraEnv(): JiraEnv {
  return jiraEnvSchema.parse(process.env);
}

export function getModelEnv(): ModelEnv {
  return modelEnvSchema.parse(process.env);
}
