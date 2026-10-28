"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { checkoutApi } from "@/lib/api/checkout";
import { useCart } from "@/lib/cart";

function CompleteContent() {
  const searchParams = useSearchParams();
  const reference = searchParams.get("reference") || searchParams.get("trxref");
  const cart = useCart();
  const [verificationRun, setVerificationRun] = useState(0);
  const [state, setState] = useState<"checking" | "paid" | "failed">(
    reference ? "checking" : "failed",
  );
  const [message, setMessage] = useState(
    reference
      ? "Confirming your payment..."
      : "We could not find a payment reference.",
  );

  useEffect(() => {
    let active = true;
    if (!reference || state === "paid" || state === "failed")
      return () => {
        active = false;
      };

    const verifyWithRetry = async () => {
      const maxAttempts = 5;
      for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
        try {
          const result = await checkoutApi.verify(reference);
          if (result.success) {
            if (!active) return;
            cart.clear();
            setState("paid");
            setMessage(
              result.message ||
                "Payment confirmed. Your order has been received.",
            );
            return;
          }
          if (attempt < maxAttempts) {
            if (!active) return;
            setMessage(
              `Payment is still processing. Checking again (${attempt}/${maxAttempts})...`,
            );
            await new Promise((resolve) => setTimeout(resolve, 2000));
            continue;
          }
          throw new Error(
            "Payment is still processing. Please try checking again in a moment.",
          );
        } catch (error) {
          if (!active) return;
          setState("failed");
          setMessage(
            error instanceof Error
              ? error.message
              : "Payment could not be confirmed. Please contact the store.",
          );
          return;
        }
      }
    };

    void verifyWithRetry();

    return () => {
      active = false;
    };
  }, [cart, reference, state, verificationRun]);

  return (
    <main className="auth-shell">
      <div className="auth-card">
        <p
          className={`eyebrow ${state === "paid" ? "text-[#3b7551]" : "text-[#a04b2b]"}`}
        >
          {state === "checking"
            ? "Payment verification"
            : state === "paid"
              ? "Order confirmed"
              : "Payment needs attention"}
        </p>
        <h1 className="mt-3 font-serif text-4xl">
          {state === "checking"
            ? "Checking your payment."
            : state === "paid"
              ? "Thank you for your order."
              : "We could not confirm payment."}
        </h1>
        <p className="mt-4 text-sm leading-6 text-[#70675d]">{message}</p>
        {reference ? (
          <p className="mt-5 text-xs text-[#8c8176]">Reference: {reference}</p>
        ) : null}
        {state === "paid" ? (
          <Link className="button-dark mt-7 w-full" href="/">
            Continue shopping
          </Link>
        ) : state === "failed" ? (
          <div className="mt-7 grid gap-3">
            <button
              className="button-dark w-full"
              onClick={() => {
                setState("checking");
                setMessage("Checking your payment again...");
                setVerificationRun((run) => run + 1);
              }}
              type="button"
            >
              Check again
            </button>
            <Link
              className="block text-center text-sm font-semibold text-[#a04b2b] hover:underline"
              href="/"
            >
              Return to Storely
            </Link>
          </div>
        ) : (
          <div className="mt-8 h-1 overflow-hidden bg-[#ded5ca]">
            <div className="h-full w-1/2 animate-pulse bg-[#a04b2b]" />
          </div>
        )}
      </div>
    </main>
  );
}

export default function CheckoutCompletePage() {
  return (
    <Suspense
      fallback={
        <main className="auth-shell">
          <p className="text-sm text-[#70675d]">Loading payment status...</p>
        </main>
      }
    >
      <CompleteContent />
    </Suspense>
  );
}
