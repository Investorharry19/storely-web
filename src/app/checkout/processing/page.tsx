"use client";

import { Suspense, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

function ProcessingContent() {
  const params = useSearchParams();
  const paymentUrl = params.get("paymentUrl");
  const reference = params.get("reference");

  useEffect(() => {
    if (paymentUrl) window.location.replace(paymentUrl);
  }, [paymentUrl]);

  return (
    <main className="auth-shell">
      <div className="auth-card">
        <p className="eyebrow text-[#a04b2b]">Payment</p>
        <h1 className="mt-3 font-serif text-4xl">Taking you to Paystack.</h1>
        <p className="mt-4 text-sm leading-6 text-[#70675d]">
          Your order has been reserved. If the payment page does not open, use
          the button below.
        </p>
        {paymentUrl ? (
          <a className="button-dark mt-7 w-full" href={paymentUrl}>
            Continue to payment
          </a>
        ) : (
          <p className="mt-7 text-sm text-[#a04b2b]">
            Payment link unavailable for reference {reference}.
          </p>
        )}
        <Link
          className="mt-5 block text-center text-sm font-semibold text-[#a04b2b] hover:underline"
          href="/"
        >
          Return to Storely
        </Link>
      </div>
    </main>
  );
}

export default function CheckoutProcessingPage() {
  return (
    <Suspense
      fallback={
        <main className="auth-shell">
          <p className="text-sm text-[#70675d]">Loading payment...</p>
        </main>
      }
    >
      <ProcessingContent />
    </Suspense>
  );
}
