import type { PlaceholderResult } from "./types.js";

function getIssueKeyFromArgs(argv: string[]): string {
  const issueKey = argv[2];
  if (!issueKey || !issueKey.trim()) {
    throw new Error("Missing issue key. Usage: npm run dev -- PRODG-123");
  }
  return issueKey.trim();
}

function buildPlaceholderResult(issueKey: string): PlaceholderResult {
  return {
    status: "placeholder",
    message:
      "Phase 1 foundation flow executed. Jira integration and agent reasoning are not implemented yet.",
    issueKey,
    phase: "phase1-foundation"
  };
}

async function main(): Promise<void> {
  try {
    const issueKey = getIssueKeyFromArgs(process.argv);
    const placeholder = buildPlaceholderResult(issueKey);
    console.log(JSON.stringify(placeholder, null, 2));
    return;
  } catch (error) {
    let message = "Unexpected failure during Phase 1 stub flow.";

    if (error instanceof Error) {
      message = error.message;
    }

    const controlledError = {
      status: "error",
      phase: "phase1-foundation",
      message
    };

    console.log(JSON.stringify(controlledError, null, 2));
    process.exitCode = 1;
  }
}

void main();
