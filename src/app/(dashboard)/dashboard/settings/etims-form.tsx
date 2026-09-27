"use client";

import { useState } from "react";
import { updateEtimsConfiguration } from "@/app/actions/settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Config = { enabled: boolean; status: string; completionMode: string; environment: string | null; apiUrl: string | null; clientId: string | null; businessPin: string | null; invoicePrefix: string | null; taxInclusive: boolean } | null;

export function EtimsForm({ config }: { config: Config }) {
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const current = config ?? { enabled: false, status: "DISABLED", completionMode: "QUEUE_FOR_SYNC", environment: "SANDBOX", apiUrl: "", clientId: "", businessPin: "", invoicePrefix: "ET", taxInclusive: true };
  async function submit(formData: FormData) {
    setPending(true); setMessage("");
    const result = await updateEtimsConfiguration({ enabled: formData.get("enabled") === "on", completionMode: formData.get("completionMode"), environment: formData.get("environment"), apiUrl: formData.get("apiUrl"), clientId: formData.get("clientId"), clientSecret: formData.get("clientSecret"), businessPin: formData.get("businessPin"), invoicePrefix: formData.get("invoicePrefix"), taxInclusive: formData.get("taxInclusive") === "on" });
    setMessage(result.ok ? "eTIMS settings saved." : result.error);
    setPending(false);
  }
  return <form action={submit} className="space-y-5">
    <div className="rounded-[var(--radius-sm)] border border-primary/20 bg-primary/5 p-4 text-sm text-muted-foreground">eTIMS is an optional DukaOS integration for businesses that need electronic tax invoicing and KRA compliance workflows. Businesses that do not require eTIMS can continue using DukaOS normally.</div>
    <div className="flex items-center justify-between rounded-[var(--radius-sm)] border border-border p-4"><div><Label htmlFor="etims-enabled">Enable eTIMS</Label><p className="mt-1 text-xs text-muted-foreground">Disabling eTIMS keeps historical DukaOS sales and invoices.</p></div><input id="etims-enabled" name="enabled" type="checkbox" defaultChecked={current.enabled} className="h-4 w-4 accent-primary" /></div>
    <div className="grid gap-4 sm:grid-cols-2"><div className="space-y-1.5"><Label htmlFor="etims-environment">Environment</Label><select id="etims-environment" name="environment" defaultValue={current.environment ?? "SANDBOX"} className="h-10 w-full rounded-[var(--radius-sm)] border border-border-strong bg-surface px-3 text-sm"><option>SANDBOX</option><option>PRODUCTION</option></select></div><div className="space-y-1.5"><Label htmlFor="etims-mode">Sale completion mode</Label><select id="etims-mode" name="completionMode" defaultValue={current.completionMode} className="h-10 w-full rounded-[var(--radius-sm)] border border-border-strong bg-surface px-3 text-sm"><option value="QUEUE_FOR_SYNC">Complete sale and queue sync</option><option value="NORMAL">Normal sale, no sync</option><option value="BLOCK_COMPLETION">Block when eTIMS fails</option></select></div><div className="space-y-1.5"><Label htmlFor="etims-url">Adapter URL</Label><Input id="etims-url" name="apiUrl" type="url" defaultValue={current.apiUrl ?? ""} placeholder="Configured adapter endpoint" /></div><div className="space-y-1.5"><Label htmlFor="etims-client">Client ID</Label><Input id="etims-client" name="clientId" defaultValue={current.clientId ?? ""} /></div><div className="space-y-1.5"><Label htmlFor="etims-secret">Client secret</Label><Input id="etims-secret" name="clientSecret" type="password" placeholder="Leave blank to keep saved secret" /></div><div className="space-y-1.5"><Label htmlFor="etims-pin">Business PIN</Label><Input id="etims-pin" name="businessPin" defaultValue={current.businessPin ?? ""} /></div><div className="space-y-1.5"><Label htmlFor="etims-prefix">Invoice prefix</Label><Input id="etims-prefix" name="invoicePrefix" defaultValue={current.invoicePrefix ?? "ET"} /></div></div>
    <label className="flex items-center gap-2 text-sm"><input name="taxInclusive" type="checkbox" defaultChecked={current.taxInclusive} className="h-4 w-4 accent-primary" /> Prices include tax</label>
    <div className="flex items-center gap-3"><Button type="submit" disabled={pending}>{pending ? "Saving..." : "Save eTIMS settings"}</Button><span className="text-sm text-muted-foreground">Status: {current.status}</span>{message && <span className="text-sm text-muted-foreground">{message}</span>}</div>
  </form>;
}
