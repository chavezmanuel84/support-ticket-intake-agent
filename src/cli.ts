import { fetchIssue } from "./jira/fetchIssue.js";
import { normalizeIssue } from "./jira/normalizeIssue.js";
import type { NormalizedTicket } from "./types.js";

function getIssueKeyFromArgs(argv: string[]): string {
  const issueKey = argv[2];
  if (!issueKey || !issueKey.trim()) {
    throw new Error("Missing issue key. Usage: npm run dev -- PRODG-123");
  }
  return issueKey.trim();
}

function buildSuccessResult(issueKey: string, normalizedTicket: NormalizedTicket): {
  status: "success";
  phase: "phase2-jira-integration";
  issueKey: string;
  normalizedTicket: NormalizedTicket;
} {
  return {
    status: "success",
    issueKey,
    phase: "phase2-jira-integration",
    normalizedTicket
  };
}

async function main(): Promise<void> {
  try {
    const issueKey = getIssueKeyFromArgs(process.argv);
    const issue = await fetchIssue(issueKey);
    const normalizedTicket = normalizeIssue(issue);
    const successResult = buildSuccessResult(issueKey, normalizedTicket);
    console.log(JSON.stringify(successResult, null, 2));
  } catch (error) {
    let message = "Unexpected failure during Phase 2 Jira integration flow.";

    if (error instanceof Error) {
      message = error.message;
    }

    const controlledError = {
      status: "error",
      phase: "phase2-jira-integration",
      message
    };

    console.log(JSON.stringify(controlledError, null, 2));
    process.exitCode = 1;
  }
}

void main();
