import type { AnalysisLanguage, NormalizedTicket, TicketAnalysis } from "../types.js";
import { createChatModel } from "./model.js";
import { buildSystemPrompt } from "../prompts/prompt.js";

const NEXT_ACTION_VALUES = new Set<TicketAnalysis["suggested_next_action"]>([
  "add_to_current_bet_sprint",
  "add_to_bet_next_sprint_high_priority",
  "add_to_bet_backlog_for_investigation",
  "escalate_to_core_team",
  "reject_ticket_ask_cx_to_solve",
  "ask_cx_for_additional_information"
]);

const COMPLETENESS_VALUES = new Set<TicketAnalysis["information_completeness"]>([
  "complete",
  "partial",
  "insufficient"
]);

const CONFIDENCE_VALUES = new Set<TicketAnalysis["confidence"]>([
  "low",
  "medium",
  "high"
]);

const PRIORITY_VALUES = new Set<TicketAnalysis["suggested_priority"]>([
  "low",
  "medium",
  "high",
  "highest"
]);

function asString(value: unknown, fieldName: string): string {
  if (typeof value !== "string") {
    throw new Error(`Agent output validation failed: ${fieldName} must be a string.`);
  }
  const trimmed = value.trim();
  if (!trimmed) {
    throw new Error(
      `Agent output validation failed: ${fieldName} must be a non-empty string.`
    );
  }
  return trimmed;
}

function asStringOrNull(value: unknown, fieldName: string): string | null {
  if (value === null) {
    return null;
  }
  return asString(value, fieldName);
}

function asStringArray(value: unknown, fieldName: string): string[] {
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string")) {
    throw new Error(`Agent output validation failed: ${fieldName} must be string[].`);
  }
  return value;
}

function assertOneOf<T extends string>(
  value: string,
  allowed: Set<T>,
  fieldName: string
): T {
  if (!allowed.has(value as T)) {
    throw new Error(`Agent output validation failed: ${fieldName} has invalid value.`);
  }
  return value as T;
}

function stripCodeFences(raw: string): string {
  const trimmed = raw.trim();
  if (trimmed.startsWith("```") && trimmed.endsWith("```")) {
    return trimmed.replace(/^```[a-zA-Z]*\n?/, "").replace(/\n?```$/, "").trim();
  }
  return trimmed;
}

function buildUserPrompt(ticket: NormalizedTicket): string {
  return JSON.stringify(
    {
      ticket
    },
    null,
    2
  );
}

function validateTicketAnalysis(payload: unknown): TicketAnalysis {
  if (!payload || typeof payload !== "object") {
    throw new Error("Agent output validation failed: expected JSON object.");
  }

  const candidate = payload as Record<string, unknown>;
  const issueKey = asString(candidate.issue_key, "issue_key");
  const ticketSummary = asString(candidate.ticket_summary, "ticket_summary");
  const informationCompleteness = assertOneOf(
    asString(candidate.information_completeness, "information_completeness"),
    COMPLETENESS_VALUES,
    "information_completeness"
  );
  const missingInformation = asStringArray(
    candidate.missing_information,
    "missing_information"
  );
  const existingAffectedProduct = asStringOrNull(
    candidate.existing_affected_product,
    "existing_affected_product"
  );
  const probableAffectedProductRaw = asString(
    candidate.probable_affected_product,
    "probable_affected_product"
  );
  const existingRelatedSubproduct = asStringOrNull(
    candidate.existing_related_subproduct,
    "existing_related_subproduct"
  );
  const probableRelatedSubproductRaw = asString(
    candidate.probable_related_subproduct,
    "probable_related_subproduct"
  );
  const suggestedNextAction = assertOneOf(
    asString(candidate.suggested_next_action, "suggested_next_action"),
    NEXT_ACTION_VALUES,
    "suggested_next_action"
  );
  const confidence = assertOneOf(
    asString(candidate.confidence, "confidence"),
    CONFIDENCE_VALUES,
    "confidence"
  );
  const reasoning = asString(candidate.reasoning, "reasoning");
  const suggestedPriority = assertOneOf(
    asString(candidate.suggested_priority, "suggested_priority"),
    PRIORITY_VALUES,
    "suggested_priority"
  );

  const probableAffectedProduct: string | "unknown" =
    probableAffectedProductRaw === "unknown"
      ? "unknown"
      : probableAffectedProductRaw;
  const probableRelatedSubproduct: string | "unknown" =
    probableRelatedSubproductRaw === "unknown"
      ? "unknown"
      : probableRelatedSubproductRaw;

  return {
    issue_key: issueKey,
    ticket_summary: ticketSummary,
    information_completeness: informationCompleteness,
    missing_information: missingInformation,
    existing_affected_product: existingAffectedProduct,
    probable_affected_product: probableAffectedProduct,
    existing_related_subproduct: existingRelatedSubproduct,
    probable_related_subproduct: probableRelatedSubproduct,
    suggested_next_action: suggestedNextAction,
    confidence,
    reasoning,
    suggested_priority: suggestedPriority
  };
}

function enforceAllowedProbableValue(
  value: string | "unknown",
  allowedValues: string[],
  fieldName: "probable_affected_product" | "probable_related_subproduct"
): string | "unknown" {
  if (value === "unknown") {
    return value;
  }

  if (allowedValues.includes(value)) {
    return value;
  }

  throw new Error(
    `Agent output validation failed: ${fieldName} must be "unknown" or one of the allowed values.`
  );
}

export async function analyzeTicket(
  ticket: NormalizedTicket,
  language: AnalysisLanguage
): Promise<TicketAnalysis> {
  const model = createChatModel();
  const systemPrompt = buildSystemPrompt(language);
  const response = await model.invoke([
    ["system", systemPrompt],
    ["user", buildUserPrompt(ticket)]
  ]);
  if (typeof response.content !== "string") {
    throw new Error("Agent output parsing failed: model response must be a string.");
  }
  const rawText = response.content;
  const cleaned = stripCodeFences(rawText);

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error("Agent output parsing failed: expected valid JSON.");
  }

  try {
    const analysis = validateTicketAnalysis(parsed);

    if (analysis.issue_key !== ticket.issueKey) {
      throw new Error(
        "Agent output validation failed: issue_key does not match input ticket."
      );
    }

    analysis.probable_affected_product = enforceAllowedProbableValue(
      analysis.probable_affected_product,
      ticket.allowedAffectedProducts,
      "probable_affected_product"
    );
    analysis.probable_related_subproduct = enforceAllowedProbableValue(
      analysis.probable_related_subproduct,
      ticket.allowedRelatedSubproducts,
      "probable_related_subproduct"
    );

    return analysis;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(error.message);
    }
    throw new Error("Agent output validation failed.");
  }
}
