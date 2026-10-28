"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";
import { paymentsApi } from "@/lib/api/payments";
import { getSession } from "@/lib/api/client";

const money = (value: number | string) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(Number(value));

export default function OwnerPaymentsPage() {
  const session = getSession();
  const [status, setStatus] = useState("");
  const summary = useQuery({
    queryKey: ["owner", "payment-summary"],
    queryFn: paymentsApi.summary,
    enabled: Boolean(session),
  });
  const payments = useQuery({
    queryKey: ["owner", "payments", status],
    queryFn: () => paymentsApi.list(status),
    enabled: Boolean(session),
  });
  if (!session)
    return (
      <main className="auth-shell">
        <div className="auth-card">
          <h1 className="font-serif text-4xl">Sign in to view payments.</h1>
          <Link className="button-dark mt-7" href="/owner/login">
            Sign in
          </Link>
        </div>
      </main>
    );
  const data = summary.data?.data;
  return (
    <main className="owner-shell">
      <div className="mx-auto max-w-6xl">
        <nav className="flex justify-between border-b border-[#ded5ca] pb-6">
          <Link className="font-serif text-2xl" href="/">
            storely<span className="text-[#a04b2b]">.</span>
          </Link>
          <Link
            className="text-sm font-semibold text-[#70675d]"
            href="/owner/manage"
          >
            Back to workspace
          </Link>
        </nav>
        <header className="py-10">
          <p className="eyebrow text-[#a04b2b]">Owner workspace</p>
          <h1 className="mt-3 font-serif text-5xl">Payments</h1>
          <p className="mt-3 text-sm text-[#70675d]">
            Track payment confirmations connected to your orders.
          </p>
        </header>
        <section className="grid gap-px border border-[#d9d0c4] bg-[#d9d0c4] sm:grid-cols-3">
          <article className="bg-[#fffdf9] p-6">
            <p className="eyebrow text-[#70675d]">Paid volume</p>
            <p className="mt-4 font-serif text-3xl">
              {money(data?.paidAmount ?? 0)}
            </p>
          </article>
          <article className="bg-[#fffdf9] p-6">
            <p className="eyebrow text-[#70675d]">Paid transactions</p>
            <p className="mt-4 font-serif text-3xl">{data?.paidCount ?? 0}</p>
          </article>
          <article className="bg-[#fffdf9] p-6">
            <p className="eyebrow text-[#70675d]">Needs attention</p>
            <p className="mt-4 font-serif text-3xl">
              {(data?.pendingCount ?? 0) + (data?.failedCount ?? 0)}
            </p>
          </article>
        </section>
        <section className="mt-8">
          <div className="mb-4 flex items-end justify-between">
            <div>
              <p className="eyebrow text-[#70675d]">Transactions</p>
              <h2 className="mt-2 font-serif text-3xl">Payment activity</h2>
            </div>
            <select
              className="field-input max-w-44"
              value={status}
              onChange={(event) => setStatus(event.target.value)}
            >
              <option value="">All statuses</option>
              <option value="PAID">Paid</option>
              <option value="PENDING">Pending</option>
              <option value="FAILED">Failed</option>
            </select>
          </div>
          {payments.isPending ? (
            <p className="py-8 text-sm text-[#70675d]">Loading payments...</p>
          ) : payments.isError ? (
            <p className="py-8 text-sm text-[#a04b2b]">
              {payments.error.message}
            </p>
          ) : (
            <div className="overflow-x-auto border border-[#d9d0c4] bg-[#fffdf9]">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-[#ded5ca] text-xs uppercase tracking-[.1em] text-[#8c8176]">
                  <tr>
                    <th className="p-4">Customer</th>
                    <th className="p-4">Order</th>
                    <th className="p-4">Amount</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.data?.data.payments.map((payment) => (
                    <tr className="border-b border-[#eee7de]" key={payment.id}>
                      <td className="p-4">{payment.order.customerName}</td>
                      <td className="p-4">
                        <Link
                          className="font-semibold hover:text-[#a04b2b]"
                          href={`/owner/manage/orders/${payment.orderId}`}
                        >
                          {payment.orderId.slice(0, 8)}...
                        </Link>
                      </td>
                      <td className="p-4 font-semibold">
                        {money(payment.amount)}
                      </td>
                      <td className="p-4">
                        <span className="status-pill">{payment.status}</span>
                      </td>
                      <td className="p-4 text-[#70675d]">
                        {new Date(payment.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
