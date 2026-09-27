"use server";

import { revalidatePath } from "next/cache";
import { assertPermission, requireAuthContext, AuthError } from "@/server/auth/context";
import { recordAudit } from "@/server/services/audit";
import type { ActionResult } from "./auth";

export async function retryEtimsSubmission(submissionId: string): Promise<ActionResult<undefined>> {
  try {
    const ctx = await requireAuthContext();
    assertPermission(ctx, "ETIMS_RETRY");
    const submission = await ctx.db.etimsSubmission.findFirst({ where: { id: submissionId }, include: { etimsInvoice: true } });
    if (!submission) return { ok: false, error: "eTIMS submission not found." };
    await ctx.db.$transaction([
      ctx.db.etimsSubmission.update({ where: { id: submission.id }, data: { status: "PENDING", nextRetryAt: new Date(), errorMessage: null } }),
      ctx.db.etimsInvoice.update({ where: { id: submission.etimsInvoiceId }, data: { status: "PENDING", lastError: null } }),
    ]);
    await recordAudit({ organizationId: ctx.organizationId, userId: ctx.userId, action: "ETIMS_RETRY_INITIATED", entityType: "EtimsSubmission", entityId: submission.id, metadata: { invoiceId: submission.etimsInvoiceId } });
    revalidatePath("/dashboard/tax-compliance/etims");
    return { ok: true, data: undefined };
  } catch (error) { if (error instanceof AuthError) return { ok: false, error: error.message }; return { ok: false, error: error instanceof Error ? error.message : "Could not retry eTIMS submission." }; }
}

export async function retryEtimsSubmissionForm(formData: FormData) {
  await retryEtimsSubmission(String(formData.get("submissionId") ?? ""));
}
