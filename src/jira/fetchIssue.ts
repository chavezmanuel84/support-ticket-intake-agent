import { getEnv } from "../config/env.js";

export type JiraIssueResponse = {
  key: string;
  fields?: Record<string, unknown>;
  renderedFields?: Record<string, unknown>;
  editmeta?: Record<string, unknown>;
};

export async function fetchIssue(issueKey: string): Promise<JiraIssueResponse> {
  const env = getEnv();
  void env;
  void issueKey;

  throw new Error(
    "fetchIssue is a Phase 1 stub. Jira REST integration will be implemented in Phase 2."
  );
}
