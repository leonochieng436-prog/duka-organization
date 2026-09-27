import "server-only";
import type { EtimsConfig, EtimsInvoicePayload, EtimsSubmissionResult } from "./types";

export async function submitInvoice(config: EtimsConfig, payload: EtimsInvoicePayload, idempotencyKey: string): Promise<EtimsSubmissionResult> {
  void payload;
  void idempotencyKey;
  if (!config.apiUrl || !config.clientId || !config.businessPin) throw new Error("Complete the eTIMS connection details before submitting.");
  throw new Error("The official KRA eTIMS adapter is not configured. No invoice was submitted.");
}

export async function testConnection(config: EtimsConfig): Promise<void> {
  if (!config.apiUrl || !config.clientId || !config.businessPin) throw new Error("Complete the eTIMS connection details before testing.");
}
