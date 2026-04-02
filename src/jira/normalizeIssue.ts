import type {
  JiraEditMeta,
  JiraIssueOptionValue,
  JiraIssueResponse,
  NormalizedTicket
} from "../types.js";

function toTrimmedString(value: unknown): string | null {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }
  return null;
}

function toOptionString(value: unknown): string | null {
  const direct = toTrimmedString(value);
  if (direct) {
    return direct;
  }

  if (value && typeof value === "object") {
    const option = value as JiraIssueOptionValue;
    return (
      toTrimmedString(option.value) ??
      toTrimmedString(option.name) ??
      toTrimmedString(option.id)
    );
  }

  return null;
}

function parseMrr(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const sanitized = value.replace(/,/g, "").trim();
    if (!sanitized) {
      return null;
    }
    const parsed = Number(sanitized);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function getAllowedValues(editmeta: JiraEditMeta | undefined, fieldId: string): string[] {
  const rawValues = editmeta?.fields?.[fieldId]?.allowedValues;
  if (!Array.isArray(rawValues)) {
    return [];
  }

  const collected = rawValues
    .map((value) => toOptionString(value))
    .filter((value): value is string => Boolean(value));

  return [...new Set(collected)];
}

export function normalizeIssue(issue: JiraIssueResponse): NormalizedTicket {
  const summary = toTrimmedString(issue.fields.summary);
  const description = toTrimmedString(issue.renderedFields?.description);
  const priority = toTrimmedString(issue.fields.priority?.name);
  const labels = Array.isArray(issue.fields.labels)
    ? issue.fields.labels.filter(
        (label): label is string => typeof label === "string" && label.trim().length > 0
      )
    : [];

  return {
    issueKey: issue.key,
    summary,
    description,
    priority,
    labels,
    clientId: toOptionString(issue.fields.customfield_10507),
    mrr: parseMrr(issue.fields.customfield_10776),
    existingAffectedProduct: toOptionString(issue.fields.customfield_11598),
    existingRelatedSubproduct: toOptionString(issue.fields.customfield_11632),
    allowedAffectedProducts: getAllowedValues(issue.editmeta, "customfield_11598"),
    allowedRelatedSubproducts: getAllowedValues(issue.editmeta, "customfield_11632")
  };
}
