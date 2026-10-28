"use client";

import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";
import { ordersApi, type OwnerOrder } from "@/lib/api/orders";
import { getSession } from "@/lib/api/client";

const money = (value: number | string) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(Number(value));

export default function OwnerOrdersPage() {
  const session = getSession();
  const queryClient = useQueryClient();
  const [status, setStatus] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("");
  const [search, setSearch] = useState("");
  const orders = useQuery({
    queryKey: ["owner", "orders", status, paymentStatus, search],
    queryFn: () =>
      ordersApi.list({ status, paymentStatus, customerName: search }),
    enabled: Boolean(session),
  });
  const update = useMutation({
    mutationFn: ({
      id,
      nextStatus,
    }: {
      id: string;
      nextStatus: OwnerOrder["status"];
    }) => ordersApi.updateStatus(id, nextStatus),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["owner", "orders"] }),
  });

  if (!session)
    return (
      <main className="auth-shell">
        <div className="auth-card">
          <h1 className="font-serif text-4xl">Sign in to manage orders.</h1>
          <Link className="button-dark mt-7" href="/owner/login">
            Sign in
          </Link>
        </div>
      </main>
    );
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
          <h1 className="mt-3 font-serif text-5xl">Orders</h1>
          <p className="mt-3 text-sm text-[#70675d]">
            Review customer orders and move each one through fulfillment.
          </p>
        </header>
        <section className="grid gap-3 border border-[#d9d0c4] bg-[#fffdf9] p-5 md:grid-cols-[1fr_180px_180px]">
          <input
            className="field-input"
            placeholder="Search customer"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <select
            className="field-input"
            value={status}
            onChange={(event) => setStatus(event.target.value)}
          >
            <option value="">All order statuses</option>
            <option value="NEW">New</option>
            <option value="PROCESSING">Processing</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
          <select
            className="field-input"
            value={paymentStatus}
            onChange={(event) => setPaymentStatus(event.target.value)}
          >
            <option value="">All payments</option>
            <option value="PAID">Paid</option>
            <option value="PENDING">Pending</option>
            <option value="FAILED">Failed</option>
          </select>
        </section>
        {orders.isPending ? (
          <p className="py-8 text-sm text-[#70675d]">Loading orders...</p>
        ) : orders.isError ? (
          <p className="py-8 text-sm text-[#a04b2b]">{orders.error.message}</p>
        ) : !orders.data?.data.orders.length ? (
          <div className="mt-6 border border-dashed border-[#cfc4b7] bg-[#fffdf9] p-10 text-center">
            <h2 className="font-serif text-2xl">No orders yet.</h2>
            <p className="mt-2 text-sm text-[#70675d]">
              Paid customer orders will appear here.
            </p>
          </div>
        ) : (
          <div className="mt-6 overflow-x-auto border border-[#d9d0c4] bg-[#fffdf9]">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-[#ded5ca] text-xs uppercase tracking-[.1em] text-[#8c8176]">
                <tr>
                  <th className="p-4">Customer</th>
                  <th className="p-4">Items</th>
                  <th className="p-4">Total</th>
                  <th className="p-4">Payment</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Action</th>
                </tr>
              </thead>
              <tbody>
                {orders.data.data.orders.map((order) => (
                  <tr className="border-b border-[#eee7de]" key={order.id}>
                    <td className="p-4">
                      <Link
                        className="font-semibold hover:text-[#a04b2b]"
                        href={`/owner/manage/orders/${order.id}`}
                      >
                        {order.customerName}
                      </Link>
                      <p className="mt-1 text-xs text-[#8c8176]">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </p>
                    </td>
                    <td className="p-4">{order.items.length}</td>
                    <td className="p-4 font-semibold">
                      {money(order.totalAmount)}
                    </td>
                    <td className="p-4">
                      <span className="status-pill">{order.paymentStatus}</span>
                    </td>
                    <td className="p-4">
                      <span className="status-pill">{order.status}</span>
                    </td>
                    <td className="p-4">
                      <select
                        className="field-input py-2 text-xs"
                        value={order.status}
                        onChange={(event) =>
                          update.mutate({
                            id: order.id,
                            nextStatus: event.target
                              .value as OwnerOrder["status"],
                          })
                        }
                      >
                        <option value="NEW">New</option>
                        <option value="PROCESSING">Processing</option>
                        <option value="COMPLETED">Completed</option>
                        <option value="CANCELLED">Cancelled</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
