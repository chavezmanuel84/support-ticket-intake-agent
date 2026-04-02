export type InformationCompleteness = "complete" | "partial" | "insufficient";

export type SuggestedNextAction =
  | "add_to_current_bet_sprint"
  | "add_to_bet_next_sprint_high_priority"
  | "add_to_bet_backlog_for_investigation"
  | "escalate_to_core_team"
  | "reject_ticket_ask_cx_to_solve"
  | "ask_cx_for_additional_information";

export type SuggestedPriority = "low" | "medium" | "high" | "highest";

export type JiraIssueOptionValue = {
  id?: string;
  value?: string;
  name?: string;
};

export type JiraIssueFields = {
  summary?: string | null;
  priority?: { name?: string | null } | null;
  labels?: string[] | null;
  customfield_10507?: unknown;
  customfield_10776?: unknown;
  customfield_11598?: unknown;
  customfield_11632?: unknown;
};

export type JiraRenderedFields = {
  description?: string | null;
};

export type JiraEditMeta = {
  fields?: Record<
    string,
    {
      allowedValues?: JiraIssueOptionValue[];
    }
  >;
};

export type JiraIssueResponse = {
  key: string;
  fields: JiraIssueFields;
  renderedFields?: JiraRenderedFields;
  editmeta?: JiraEditMeta;
};

export type NormalizedTicket = {
  issueKey: string;
  summary: string | null;
  description: string | null;
  priority: string | null;
  labels: string[];
  clientId: string | null;
  mrr: number | null;
  existingAffectedProduct: string | null;
  existingRelatedSubproduct: string | null;
  allowedAffectedProducts: string[];
  allowedRelatedSubproducts: string[];
};

export type TicketAnalysis = {
  issue_key: string;
  ticket_summary: string;
  information_completeness: InformationCompleteness;
  missing_information: string[];
  existing_affected_product: string | null;
  probable_affected_product: string | "unknown";
  existing_related_subproduct: string | null;
  probable_related_subproduct: string | "unknown";
  suggested_next_action: SuggestedNextAction;
  confidence: "low" | "medium" | "high";
  reasoning: string;
  suggested_priority: SuggestedPriority;
};
