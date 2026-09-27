import type { EtimsInvoiceStatus, EtimsStatus, SaleCompletionMode } from "@prisma/client";

export type EtimsConfig = {
  enabled: boolean;
  status: EtimsStatus;
  completionMode: SaleCompletionMode;
  apiUrl: string | null;
  clientId: string | null;
  businessPin: string | null;
  environment: string | null;
  taxInclusive: boolean;
};

export type EtimsInvoicePayload = {
  invoiceNumber: string;
  saleId: string;
  organizationId: string;
  branchId: string;
  businessPin: string | null;
  subtotal: string;
  taxTotal: string;
  total: string;
  items: Array<{ description: string; sku: string | null; quantity: string; unitPrice: string; taxRate: string; taxAmount: string; total: string }>;
};

export type EtimsSubmissionResult = {
  status: Extract<EtimsInvoiceStatus, "SUBMITTED" | "ACCEPTED" | "REJECTED">;
  reference?: string;
  response?: unknown;
};
