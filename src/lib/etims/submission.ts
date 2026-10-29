import "server-only";
import type { Prisma, PrismaClient, EtimsInvoiceStatus } from "@prisma/client";
import { submitInvoice } from "./client";
import type { EtimsConfig, EtimsInvoicePayload } from "./types";

export async function queueInvoice(tx: Prisma.TransactionClient, input: { organizationId: string; branchId: string; saleId: string; invoiceNumber: string; subtotal: string; taxTotal: string; total: string; payload: EtimsInvoicePayload }) {
  const invoice = await tx.etimsInvoice.upsert({
    where: { saleId: input.saleId },
    update: { payload: input.payload, subtotal: input.subtotal, taxTotal: input.taxTotal, total: input.total, status: "PENDING", lastError: null },
    create: { organizationId: input.organizationId, branchId: input.branchId, saleId: input.saleId, invoiceNumber: input.invoiceNumber, subtotal: input.subtotal, taxTotal: input.taxTotal, total: input.total, payload: input.payload, status: "PENDING" },
  });
  await tx.etimsSubmission.upsert({
    where: { idempotencyKey: `sale:${input.saleId}` },
    update: { status: "PENDING", errorMessage: null, nextRetryAt: null },
    create: { organizationId: input.organizationId, etimsInvoiceId: invoice.id, idempotencyKey: `sale:${input.saleId}`, status: "PENDING" },
  });
  return invoice;
}

export async function submitQueuedInvoice(db: PrismaClient, submissionId: string, config: EtimsConfig) {
  const submission = await db.etimsSubmission.findFirst({ where: { id: submissionId, organizationId: config.enabled ? undefined : "__disabled__" }, include: { etimsInvoice: true } });
  if (!submission) throw new Error("eTIMS submission not found.");
  const attemptNumber = submission.attemptCount + 1;
  try {
    const result = await submitInvoice(config, submission.etimsInvoice.payload as unknown as EtimsInvoicePayload, submission.idempotencyKey);
    await db.$transaction([
      db.etimsSubmission.update({ where: { id: submission.id }, data: { status: result.status, attemptCount: attemptNumber, lastAttemptAt: new Date(), submittedAt: new Date(), responseRef: result.reference ?? null, response: result.response as Prisma.InputJsonValue } }),
      db.etimsInvoice.update({ where: { id: submission.etimsInvoiceId }, data: { status: result.status as EtimsInvoiceStatus, etimsReference: result.reference ?? null, response: result.response as Prisma.InputJsonValue, lastError: null } }),
      db.etimsSyncAttempt.create({ data: { submissionId: submission.id, attemptNumber, status: result.status, response: result.response as Prisma.InputJsonValue } }),
    ]);
    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message : "eTIMS submission failed.";
    await db.$transaction([
      db.etimsSubmission.update({ where: { id: submission.id }, data: { status: "FAILED", attemptCount: attemptNumber, lastAttemptAt: new Date(), nextRetryAt: new Date(Date.now() + Math.min(60 * 60 * 1000, 2 ** attemptNumber * 60 * 1000)), errorMessage: message } }),
      db.etimsInvoice.update({ where: { id: submission.etimsInvoiceId }, data: { status: "FAILED", lastError: message } }),
      db.etimsSyncAttempt.create({ data: { submissionId: submission.id, attemptNumber, status: "FAILED", errorMessage: message } }),
    ]);
    throw error;
  }
}
