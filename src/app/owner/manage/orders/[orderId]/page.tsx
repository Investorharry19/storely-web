"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ordersApi, type OwnerOrder } from "@/lib/api/orders";
import { getSession } from "@/lib/api/client";

const money = (value: number | string) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(Number(value));

const parseDeliveryLocation = (value: string | null) => {
  if (!value) return null;
  const match = value.match(
    /^Exact location: ([^|]+) \| Open in Maps: (https:\/\/\S+)$/,
  );
  return match ? { coordinates: match[1].trim(), mapsUrl: match[2] } : null;
};

export default function OrderDetailPage() {
  const session = getSession();
  const params = useParams<{ orderId: string }>();
  const queryClient = useQueryClient();
  const order = useQuery({
    queryKey: ["owner", "order", params.orderId],
    queryFn: () => ordersApi.get(params.orderId),
    enabled: Boolean(session && params.orderId),
  });
  const update = useMutation({
    mutationFn: (status: OwnerOrder["status"]) =>
      ordersApi.updateStatus(params.orderId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["owner", "order", params.orderId],
      });
      queryClient.invalidateQueries({ queryKey: ["owner", "orders"] });
    },
  });
  if (!session)
    return (
      <main className="auth-shell">
        <div className="auth-card">
          <h1 className="font-serif text-4xl">Sign in to view orders.</h1>
          <Link className="button-dark mt-7" href="/owner/login">
            Sign in
          </Link>
        </div>
      </main>
    );
  if (order.isPending)
    return (
      <main className="auth-shell">
        <p className="text-sm text-[#70675d]">Loading order...</p>
      </main>
    );
  if (order.isError || !order.data?.data)
    return (
      <main className="auth-shell">
        <div className="auth-card">
          <h1 className="font-serif text-3xl">Order not found.</h1>
          <Link className="button-dark mt-7" href="/owner/manage/orders">
            Back to orders
          </Link>
        </div>
      </main>
    );
  const item = order.data.data;
  const exactLocation = parseDeliveryLocation(item.deliveryAddress);
  return (
    <main className="owner-shell">
      <div className="mx-auto max-w-4xl">
        <nav className="flex justify-between border-b border-[#ded5ca] pb-6">
          <Link className="font-serif text-2xl" href="/">
            storely<span className="text-[#a04b2b]">.</span>
          </Link>
          <Link
            className="text-sm font-semibold text-[#70675d]"
            href="/owner/manage/orders"
          >
            Back to orders
          </Link>
        </nav>
        <header className="flex flex-col justify-between gap-4 py-10 sm:flex-row sm:items-end">
          <div>
            <p className="eyebrow text-[#a04b2b]">Order detail</p>
            <h1 className="mt-3 font-serif text-5xl">{item.customerName}</h1>
            <p className="mt-3 text-sm text-[#70675d]">{item.id}</p>
          </div>
          <select
            className="field-input max-w-xs"
            value={item.status}
            onChange={(event) =>
              update.mutate(event.target.value as OwnerOrder["status"])
            }
          >
            <option value="NEW">New</option>
            <option value="PROCESSING">Processing</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </header>
        <div className="grid gap-6 md:grid-cols-2">
          <section className="border border-[#d9d0c4] bg-[#fffdf9] p-6">
            <p className="eyebrow text-[#70675d]">Customer</p>
            <p className="mt-4 font-semibold">{item.customerName}</p>
            <p className="mt-2 text-sm text-[#70675d]">{item.customerPhone}</p>
            {item.customerEmail ? (
              <p className="mt-1 text-sm text-[#70675d]">
                {item.customerEmail}
              </p>
            ) : null}
            {item.deliveryAddress ? (
              exactLocation ? (
                <div className="mt-4 text-sm text-[#70675d]">
                  <p>Exact location: {exactLocation.coordinates}</p>
                  <a
                    className="mt-2 inline-block font-semibold text-[#a04b2b] hover:underline"
                    href={exactLocation.mapsUrl}
                    rel="noreferrer"
                    target="_blank"
                  >
                    Open delivery location in Maps
                  </a>
                </div>
              ) : (
                <p className="mt-4 text-sm text-[#70675d]">
                  {item.deliveryAddress}
                </p>
              )
            ) : null}
          </section>
          <section className="border border-[#d9d0c4] bg-[#fffdf9] p-6">
            <p className="eyebrow text-[#70675d]">Payment</p>
            <p className="mt-4 text-2xl font-semibold text-[#a04b2b]">
              {money(item.totalAmount)}
            </p>
            <p className="mt-2 text-sm text-[#70675d]">{item.paymentStatus}</p>
          </section>
        </div>
        <section className="mt-6 border border-[#d9d0c4] bg-[#fffdf9] p-6">
          <p className="eyebrow text-[#70675d]">Items</p>
          {item.items.map((line) => (
            <div
              className="flex justify-between border-b border-[#eee7de] py-4 text-sm"
              key={line.id}
            >
              <span>
                {line.itemName} × {line.quantity}
              </span>
              <span className="font-semibold">{money(line.subtotal)}</span>
            </div>
          ))}
        </section>
      </div>
    </main>
  );
}
