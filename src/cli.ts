import { fetchIssue } from "./jira/fetchIssue.js";
import { normalizeIssue } from "./jira/normalizeIssue.js";
import { analyzeTicket } from "./agent/analyzeTicket.js";
import type {
  AnalysisLanguage,
  ControlledErrorResult,
  Phase3SuccessResult,
  NormalizedTicket,
  TicketAnalysis
} from "./types.js";

function parseCliArgs(argv: string[]): {
  issueKey: string;
  language: AnalysisLanguage;
} {
  const args = argv.slice(2);
  let language: AnalysisLanguage = "en";
  let issueKey: string | null = null;

  for (const arg of args) {
    if (arg === "--es") {
      language = "es";
      continue;
    }

    if (arg === "--en") {
      language = "en";
      continue;
    }

    if (arg.startsWith("--")) {
      throw new Error(`Unsupported flag: ${arg}`);
    }

    if (!issueKey) {
      issueKey = arg.trim();
      continue;
    }

    throw new Error("Too many positional arguments. Usage: npm run dev -- [--es] PRODG-123");
  }

  if (!issueKey) {
    throw new Error("Missing issue key. Usage: npm run dev -- [--es] PRODG-123");
  }

  return { issueKey, language };
}

function buildSuccessResult(
  issueKey: string,
  analysis: TicketAnalysis
): Phase3SuccessResult {
  return {
    status: "success",
    issueKey,
    phase: "phase3-agent-analysis",
    analysis
  };
}

function buildSkippedResult(
  issueKey: string,
  normalizedTicket: NormalizedTicket
): {
  status: "skipped";
  phase: "phase3-agent-analysis";
  issueKey: string;
  ticketStatus: string | null;
  reason: string;
} {
  return {
    status: "skipped",
    phase: "phase3-agent-analysis",
    issueKey,
    ticketStatus: normalizedTicket.status,
    reason: 'Ticket is not eligible for intake analysis in this MVP (status must be "To Do").'
  };
}

async function main(): Promise<void> {
  try {
    const { issueKey, language } = parseCliArgs(process.argv);
    const issue = await fetchIssue(issueKey);
    const normalizedTicket = normalizeIssue(issue);
    if (normalizedTicket.status !== "To Do") {
      const skippedResult = buildSkippedResult(issueKey, normalizedTicket);
      console.log(JSON.stringify(skippedResult, null, 2));
      return;
    }
    const analysis = await analyzeTicket(normalizedTicket, language);
    const successResult = buildSuccessResult(issueKey, analysis);
    console.log(JSON.stringify(successResult, null, 2));
  } catch (error) {
    let message = "Unexpected failure during Phase 3 agent analysis flow.";

    if (error instanceof Error) {
      message = error.message;
    }

    const controlledError: ControlledErrorResult = {
      status: "error",
      phase: "phase3-agent-analysis",
      message
    };

    console.log(JSON.stringify(controlledError, null, 2));
    process.exitCode = 1;
  }
}

void main();
