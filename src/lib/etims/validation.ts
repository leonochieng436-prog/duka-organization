import { z } from "zod";

export const etimsConfigurationSchema = z.object({
  enabled: z.boolean(),
  completionMode: z.enum(["NORMAL", "QUEUE_FOR_SYNC", "BLOCK_COMPLETION"]),
  environment: z.string().trim().max(30).optional().or(z.literal("")),
  apiUrl: z.string().trim().url().max(500).optional().or(z.literal("")),
  clientId: z.string().trim().max(160).optional().or(z.literal("")),
  clientSecret: z.string().max(500).optional().or(z.literal("")),
  businessPin: z.string().trim().max(40).optional().or(z.literal("")),
  invoicePrefix: z.string().trim().max(20).optional().or(z.literal("")),
  taxInclusive: z.boolean(),
});

export type EtimsConfigurationInput = z.infer<typeof etimsConfigurationSchema>;
