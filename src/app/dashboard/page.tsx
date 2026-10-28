"use client";

import { useQuery } from "@tanstack/react-query";
import { adminApi } from "@/lib/api/admin";
import { getSession } from "@/lib/api/client";

const metrics = [
  ["totalStores", "Stores"],
  ["pendingUsers", "Pending users"],
  ["totalOrders", "Orders"],
  ["totalCustomers", "Customers"],
  ["totalRevenue", "Revenue"],
  ["pendingPayments", "Pending payments"],
] as const;

export default function DashboardPage() {
  const session = getSession();
  const dashboard = useQuery({
    queryKey: ["admin", "dashboard-metrics"],
    queryFn: adminApi.getDashboardMetrics,
    enabled: Boolean(session),
  });

  const data = dashboard.data?.data;

  return (
    <main className="min-h-screen bg-[#f4f1eb] px-6 py-8 text-[#24201c] sm:px-10">
      <div className="mx-auto max-w-7xl">
        <header className="mb-10 flex flex-col justify-between gap-5 border-b border-[#d8d0c5] pb-7 sm:flex-row sm:items-end">
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-[#a04b2b]">
              Storely / Operations
            </p>
            <h1 className="font-serif text-4xl tracking-tight sm:text-5xl">
              Good morning
              {session?.user.fullName
                ? `, ${session.user.fullName.split(" ")[0]}`
                : ""}
              .
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-[#6d655d]">
              A live view of the marketplace, sellers, and payments that keep
              Storely moving.
            </p>
          </div>
          <a
            className="text-sm font-semibold text-[#a04b2b] underline-offset-4 hover:underline"
            href="/admin/login"
          >
            Admin sign in
          </a>
        </header>

        {!session ? (
          <section className="border border-[#d8d0c5] bg-[#fffdf9] p-8 shadow-[8px_8px_0_#ded5c8]">
            <h2 className="font-serif text-2xl">
              Sign in to view live metrics
            </h2>
            <p className="mt-2 max-w-lg text-sm leading-6 text-[#6d655d]">
              The typed dashboard query is ready. Connect with an admin account
              to load protected metrics from the backend.
            </p>
            <a
              className="mt-6 inline-flex bg-[#24201c] px-5 py-3 text-sm font-semibold text-white hover:bg-[#a04b2b]"
              href="/admin/login"
            >
              Continue to admin sign in
            </a>
          </section>
        ) : dashboard.isPending ? (
          <p className="text-sm text-[#6d655d]">Loading your workspace...</p>
        ) : dashboard.isError ? (
          <p className="border border-[#e3b9a9] bg-[#fff4ef] p-4 text-sm text-[#8d3e23]">
            {dashboard.error.message}
          </p>
        ) : (
          <section className="grid gap-px border border-[#d8d0c5] bg-[#d8d0c5] sm:grid-cols-2 lg:grid-cols-3">
            {metrics.map(([key, label]) => (
              <article className="bg-[#fffdf9] p-6" key={key}>
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#8c8176]">
                  {label}
                </p>
                <p className="mt-5 font-serif text-4xl">
                  {data?.[key]?.toLocaleString() ?? "-"}
                </p>
              </article>
            ))}
          </section>
        )}
      </div>
    </main>
  );
}
