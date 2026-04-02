import type { NormalizedTicket, TicketAnalysis } from "../types.js";
import { createChatModel } from "./model.js";

export async function analyzeTicket(
  ticket: NormalizedTicket
): Promise<TicketAnalysis> {
  void createChatModel();
  void ticket;

  throw new Error(
    "analyzeTicket is a Phase 1 stub. Agent reasoning will be implemented in Phase 3."
  );
}
