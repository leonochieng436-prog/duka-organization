import { redirect } from "next/navigation";
import { CheckCircle2, Clock3, PauseCircle, Store } from "lucide-react";
import { adminLogout, approveSubscription } from "@/app/actions/admin";
import { getCurrentAdmin } from "@/server/auth/admin-session";
import { rawPrisma } from "@/server/db/client";
import { BusinessDirectory, type AdminBusiness } from "./business-directory";

const metricStyles = {
  neutral: { icon: "bg-surface-muted text-muted-foreground", value: "text-foreground" },
  success: { icon: "bg-success-tint text-success", value: "text-success" },
  warning: { icon: "bg-warning-tint text-warning", value: "text-warning" },
};

function Metric({ label, value, tone, icon }: { label: string; value: number; tone: keyof typeof metricStyles; icon: React.ReactNode }) {
  const style = metricStyles[tone];
  return <div className="rounded-xl border border-border bg-surface p-5"><div className={`grid h-9 w-9 place-items-center rounded-lg ${style.icon}`}>{icon}</div><p className="mt-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p><p className={`mt-1 text-3xl font-semibold tracking-tight ${style.value}`}>{value}</p></div>;
}

export default async function AdminPage() {
  if (!await getCurrentAdmin()) redirect("/admin/login");
  const subscriptions = await rawPrisma.subscription.findMany({
    include: { organization: { include: { branches: { include: { registers: true } }, users: { include: { user: true, role: true } } } }, approvedByAdmin: true },
    orderBy: { createdAt: "desc" },
  });
  const contactEnquiries = await rawPrisma.$queryRaw<Array<{
    id: string;
    fullName: string;
    businessName: string;
    email: string;
    phone: string;
    businessType: string | null;
    numberOfLocations: string | null;
    message: string;
    createdAt: Date;
  }>>`
    SELECT "id", "fullName", "businessName", "email", "phone",
      "businessType", "numberOfLocations", "message", "createdAt"
    FROM "contact_enquiries"
    ORDER BY "createdAt" DESC
    LIMIT 20
  `;
  const pending = subscriptions.filter((subscription) => subscription.status === "pending_payment");
  const activeCount = subscriptions.filter((subscription) => subscription.status === "active").length;
  const pausedCount = subscriptions.filter((subscription) => subscription.status === "paused").length;
  const businesses: AdminBusiness[] = subscriptions.map((subscription) => ({
    id: subscription.organizationId,
    name: subscription.organization.name,
    ownerName: subscription.organization.users[0]?.user.name ?? "Unknown owner",
    ownerEmail: subscription.organization.users[0]?.user.email ?? "No email",
    plan: subscription.plan,
    status: subscription.status,
    registeredAt: subscription.createdAt.toISOString(),
    approvedAt: subscription.approvedAt?.toISOString() ?? null,
    branchCount: subscription.organization.branches.filter((branch) => branch.isActive).length,
    registerCount: subscription.organization.branches.reduce((total, branch) => total + branch.registers.filter((register) => register.isActive).length, 0),
    userCount: subscription.organization.users.filter((membership) => membership.isActive).length,
    branchLimit: subscription.branchLimit,
    registerLimit: subscription.registerLimit,
    userLimit: subscription.userLimit,
    users: subscription.organization.users.filter((membership) => membership.isActive).map((membership) => ({ name: membership.user.name, email: membership.user.email, role: membership.role.name })),
  }));

  return <div className="min-h-screen bg-background">
    <header className="flex items-center justify-between border-b border-border bg-surface px-5 py-4 sm:px-8"><div><p className="text-sm font-semibold">DukaOS Admin</p><p className="text-xs text-muted-foreground">Platform Administration</p></div><div className="flex items-center gap-4"><span className="hidden text-sm text-muted-foreground sm:inline">Administrator</span><form action={adminLogout}><button className="text-sm font-semibold text-primary hover:underline">Log out</button></form></div></header>
    <main className="mx-auto max-w-7xl space-y-8 px-5 py-8 sm:px-8">
      <div><p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">Platform control center</p><h1 className="mt-2 text-3xl font-semibold tracking-tight">Manage DukaOS businesses</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">Manage registered businesses, review payment approvals, control platform access, and oversee business accounts.</p></div>
      <section><div className="mb-4"><h2 className="text-lg font-semibold">Platform overview</h2></div><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><Metric label="Registered businesses" value={subscriptions.length} tone="neutral" icon={<Store size={18} />} /><Metric label="Active businesses" value={activeCount} tone="success" icon={<CheckCircle2 size={18} />} /><Metric label="Paused businesses" value={pausedCount} tone="warning" icon={<PauseCircle size={18} />} /><Metric label="Pending approvals" value={pending.length} tone="neutral" icon={<Clock3 size={18} />} /></div></section>
      <section className="overflow-hidden rounded-xl border border-border bg-surface">
        <div className="border-b border-border px-5 py-5">
          <h2 className="font-semibold">Recent contact enquiries</h2>
          <p className="mt-1 text-sm text-muted-foreground">The latest 20 requests sent from the public contact form.</p>
        </div>
        {contactEnquiries.length === 0 ? (
          <p className="px-5 py-8 text-sm text-muted-foreground">No contact enquiries yet.</p>
        ) : (
          <div className="divide-y divide-border">
            {contactEnquiries.map((enquiry) => {
              const normalizedPhone = enquiry.phone.replace(/\D/g, "").replace(/^0/, "254");
              return (
                <article key={enquiry.id} className="space-y-3 px-5 py-5">
                  <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-start">
                    <div>
                      <h3 className="font-semibold">{enquiry.businessName}</h3>
                      <p className="mt-1 text-sm text-muted-foreground">{enquiry.fullName} · {enquiry.createdAt.toLocaleString()}</p>
                    </div>
                    <div className="flex flex-wrap gap-3 text-sm font-medium">
                      <a href={`mailto:${enquiry.email}`} className="text-primary hover:underline">{enquiry.email}</a>
                      {normalizedPhone ? (
                        <a href={`https://wa.me/${normalizedPhone}?text=${encodeURIComponent(`Following up on your DukaOS enquiry from ${enquiry.fullName}.`)}`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">WhatsApp follow-up</a>
                      ) : null}
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">Phone: {enquiry.phone} · Business type: {enquiry.businessType || "Not specified"} · Locations: {enquiry.numberOfLocations || "Not specified"}</p>
                  <p className="whitespace-pre-wrap text-sm leading-6">{enquiry.message}</p>
                </article>
              );
            })}
          </div>
        )}
      </section>
      <section><div className="mb-4"><h2 className="text-lg font-semibold">Business operations</h2><p className="mt-1 text-sm text-muted-foreground">Pause or resume access from the action menu. Permanent deletion is separated as an irreversible action.</p></div><BusinessDirectory businesses={businesses} /></section>
      <section className="overflow-hidden rounded-xl border border-border bg-surface"><div className="border-b border-border px-5 py-5"><h2 className="font-semibold">Pending payment approvals</h2><p className="mt-1 text-sm text-muted-foreground">{pending.length} {pending.length === 1 ? "registration" : "registrations"} awaiting approval</p></div>{pending.length === 0 ? <div className="px-5 py-12 text-center"><div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-success-tint text-success"><CheckCircle2 size={23} /></div><p className="mt-4 font-medium">No pending approvals</p><p className="mx-auto mt-1 max-w-md text-sm leading-6 text-muted-foreground">New payment submissions will appear here for verification before the business is granted platform access.</p></div> : <div className="divide-y divide-border">{pending.map((subscription) => { const owner = subscription.organization.users[0]?.user; return <div key={subscription.id} className="grid gap-5 px-5 py-5 lg:grid-cols-[1.3fr_1fr_auto] lg:items-center"><div><p className="font-semibold">{subscription.organization.name}</p><p className="mt-1 text-sm text-muted-foreground">{owner?.name} · {owner?.email}</p><p className="mt-1 text-xs text-muted-foreground">{subscription.plan} plan · Registered {subscription.createdAt.toLocaleString()}</p></div><div><p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Payment reference</p><p className="mt-1 text-sm font-medium">{subscription.paymentReference || "Not submitted"}</p><p className="mt-1 text-xs text-muted-foreground">{subscription.paymentSubmittedAt ? `Submitted ${subscription.paymentSubmittedAt.toLocaleString()}` : "Waiting for customer"}</p></div><form action={approveSubscription}><input type="hidden" name="subscriptionId" value={subscription.id} /><button type="submit" disabled={!subscription.paymentReference} className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40">Approve payment</button></form></div>; })}</div>}</section>
    </main>
  </div>;
}
