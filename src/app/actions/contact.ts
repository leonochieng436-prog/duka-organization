"use server";

import { randomUUID } from "node:crypto";
import { z } from "zod";
import { rawPrisma } from "@/server/db/client";

const contactSchema = z.object({
  fullName: z.string().trim().min(2, "Please enter your full name.").max(120),
  businessName: z.string().trim().min(2, "Please enter your business name.").max(160),
  email: z.string().trim().email("Please enter a valid email address.").max(254),
  phone: z.string().trim().min(7, "Please enter a valid phone number.").max(40),
  businessType: z.string().trim().max(100).optional().or(z.literal("")),
  numberOfLocations: z.string().trim().max(40).optional().or(z.literal("")),
  currentSystem: z.string().trim().max(200).optional().or(z.literal("")),
  interest: z.string().trim().max(120).optional().or(z.literal("")),
  message: z.string().trim().min(10, "Please share a few more details about your needs.").max(5000),
});

export async function submitContactEnquiry(raw: unknown) {
  const parsed = contactSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors;
    const fieldLabels: Record<string, string> = {
      fullName: "Full name",
      businessName: "Business name",
      email: "Email address",
      phone: "Phone number",
      businessType: "Business type",
      numberOfLocations: "Number of locations",
      currentSystem: "Current POS / business system",
      interest: "Interest",
      message: "Message",
    };
    const invalidFields = Object.keys(fieldErrors)
      .map((field) => fieldLabels[field] ?? field)
      .join(", ");

    return {
      ok: false as const,
      error: invalidFields
        ? `Please check ${invalidFields} and try again.`
        : "Please review your enquiry and try again.",
      fieldErrors,
    };
  }

  const input = parsed.data;
  const details = {
    fullName: input.fullName,
    businessName: input.businessName,
    email: input.email,
    phone: input.phone,
    businessType: input.businessType || null,
    numberOfLocations: input.numberOfLocations || null,
    currentSystem: input.currentSystem || null,
    interest: input.interest || null,
    message: input.message,
  };

  try {
    await rawPrisma.$executeRaw`
      INSERT INTO "contact_enquiries" (
        "id", "fullName", "businessName", "email", "phone", "businessType",
        "numberOfLocations", "currentSystem", "interest", "message"
      ) VALUES (
        ${randomUUID()}, ${details.fullName}, ${details.businessName}, ${details.email},
        ${details.phone}, ${details.businessType}, ${details.numberOfLocations},
        ${details.currentSystem}, ${details.interest}, ${details.message}
      )
    `;
  } catch (error) {
    console.error("CONTACT_ENQUIRY_SAVE_ERROR", error);
    return {
      ok: false as const,
      error: "We couldn't save your enquiry right now. Please try again in a few minutes or contact us directly.",
    };
  }

  return {
    ok: true as const,
    message: "Your enquiry is saved. WhatsApp is opening with your message—press Send there to deliver it to DukaOS.",
  };
}
