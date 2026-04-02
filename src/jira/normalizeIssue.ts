import type { JiraIssueResponse } from "./fetchIssue.js";
import type { NormalizedTicket } from "../types.js";

export function normalizeIssue(issue: JiraIssueResponse): NormalizedTicket {
  return {
    issueKey: issue.key,
    summary: null,
    description: null,
    priority: null,
    labels: [],
    clientId: null,
    mrr: null,
    existingAffectedProduct: null,
    existingRelatedSubproduct: null,
    allowedAffectedProducts: [],
    allowedRelatedSubproducts: []
  };
}
