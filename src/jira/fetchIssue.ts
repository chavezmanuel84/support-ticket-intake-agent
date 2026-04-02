import { getJiraEnv } from "../config/env.js";
import type { JiraIssueResponse } from "../types.js";
import { ZodError } from "zod";

const ISSUE_KEY_PATTERN = /^[A-Z][A-Z0-9]+-\d+$/;
const JIRA_FIELDS =
  "summary,description,priority,labels,customfield_10507,customfield_10776,customfield_11598,customfield_11632";
const JIRA_EXPAND = "renderedFields,editmeta";

function buildIssueUrl(baseUrl: string, issueKey: string): URL {
  const normalizedBaseUrl = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
  const url = new URL(
    `rest/api/3/issue/${encodeURIComponent(issueKey)}`,
    normalizedBaseUrl
  );
  url.searchParams.set("fields", JIRA_FIELDS);
  url.searchParams.set("expand", JIRA_EXPAND);
  return url;
}

function messageForStatus(status: number): string {
  switch (status) {
    case 400:
      return "Jira request failed: malformed issue key.";
    case 401:
    case 403:
      return "Jira request failed: authentication or permission error.";
    case 404:
      return "Jira request failed: issue not found.";
    case 429:
      return "Jira request failed: rate limit exceeded.";
    default:
      if (status >= 500) {
        return "Jira request failed: upstream Jira service error.";
      }
      return `Jira request failed with status ${status}.`;
  }
}

function assertValidIssueKey(issueKey: string): void {
  const sanitized = issueKey.trim();
  if (!sanitized || !ISSUE_KEY_PATTERN.test(sanitized)) {
    throw new Error(
      "Invalid issue key format. Expected pattern like PRODG-12345."
    );
  }
}

export async function fetchIssue(issueKey: string): Promise<JiraIssueResponse> {
  const sanitizedIssueKey = issueKey.trim();
  assertValidIssueKey(sanitizedIssueKey);

  let env;
  try {
    env = getJiraEnv();
  } catch (error) {
    if (error instanceof ZodError) {
      const invalidVars = error.issues
        .map((issue) => issue.path.join("."))
        .filter((item) => item.length > 0);
      throw new Error(
        `Environment validation failed. Missing or invalid variables: ${invalidVars.join(
          ", "
        )}`
      );
    }
    throw error;
  }
  const url = buildIssueUrl(env.JIRA_BASE_URL, sanitizedIssueKey);
  const authToken = Buffer.from(
    `${env.JIRA_EMAIL}:${env.JIRA_API_TOKEN}`
  ).toString("base64");
  let response: Response;
  try {
    response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Basic ${authToken}`
      }
    });
  } catch {
    throw new Error("Jira request failed: network or connectivity error.");
  }

  if (!response.ok) {
    throw new Error(messageForStatus(response.status));
  }

  const payload: unknown = await response.json();
  if (!payload || typeof payload !== "object") {
    throw new Error("Jira response parsing failed: expected JSON object.");
  }

  const candidate = payload as Partial<JiraIssueResponse>;
  if (!candidate.key || typeof candidate.key !== "string") {
    throw new Error("Jira response parsing failed: missing issue key.");
  }

  if (!candidate.key.startsWith("PRODG-")) {
    throw new Error("Issue is outside PRODG scope.");
  }

  return {
    key: candidate.key,
    fields: candidate.fields ?? {},
    renderedFields: candidate.renderedFields ?? {},
    editmeta: candidate.editmeta ?? {}
  };
}
