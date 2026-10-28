"use client";

import { FormEvent, useState } from "react";
import { useEffect, useRef } from "react";
import { importLibrary, setOptions } from "@googlemaps/js-api-loader";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { checkoutApi } from "@/lib/api/checkout";
import { useCart } from "@/lib/cart";

const money = (value: number) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(value);

export default function CheckoutPage() {
  const cart = useCart();
  const router = useRouter();
  const [form, setForm] = useState({
    customerName: "",
    customerPhone: "",
    customerEmail: "",
    deliveryAddress: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [addressMode, setAddressMode] = useState<"exact" | "area">("area");
  const [locationStatus, setLocationStatus] = useState("");
  const addressInputRef = useRef<HTMLInputElement>(null);
  const mapsKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  useEffect(() => {
    if (!mapsKey || !addressInputRef.current || addressMode !== "area") return;

    setOptions({ key: mapsKey, v: "weekly" });
    let autocomplete: google.maps.places.Autocomplete | undefined;
    let mounted = true;

    importLibrary("places").then(({ Autocomplete }) => {
      if (!mounted || !addressInputRef.current) return;
      autocomplete = new Autocomplete(addressInputRef.current, {
        fields: ["formatted_address", "name"],
        types: ["geocode"],
      });
      autocomplete.addListener("place_changed", () => {
        const place = autocomplete?.getPlace();
        const address = place?.formatted_address ?? place?.name;
        if (address)
          setForm((current) => ({ ...current, deliveryAddress: address }));
      });
    });

    return () => {
      mounted = false;
      if (autocomplete) google.maps.event.clearInstanceListeners(autocomplete);
    };
  }, [addressMode, mapsKey]);

  const useExactLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus("Location is not supported by this browser.");
      return;
    }
    setAddressMode("exact");
    setLocationStatus("Finding your location...");
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const coordinates = `${coords.latitude.toFixed(6)},${coords.longitude.toFixed(6)}`;
        const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${coordinates}`;
        setForm((current) => ({
          ...current,
          deliveryAddress: `Exact location: ${coordinates} | Open in Maps: ${mapsUrl}`,
        }));
        setLocationStatus("Exact location selected and ready to share.");
      },
      () => setLocationStatus("Location permission was not granted."),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!cart.items.length) return;
    setLoading(true);
    setError("");
    try {
      const result = await checkoutApi.initialize({
        businessSlug: cart.items[0].businessSlug,
        ...form,
        items: cart.items.map(({ itemId, itemType, quantity }) => ({
          itemId,
          itemType,
          quantity,
        })),
      });
      router.push(
        `/checkout/processing?reference=${encodeURIComponent(result.data.reference)}&paymentUrl=${encodeURIComponent(result.data.paymentUrl)}`,
      );
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "We could not start checkout.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="store-shell">
      <div className="mx-auto max-w-6xl">
        <nav className="flex items-center justify-between border-b border-[#ded5ca] pb-7">
          <Link className="font-serif text-2xl" href="/">
            storely<span className="text-[#a04b2b]">.</span>
          </Link>
          {cart.items[0] ? (
            <Link
              className="text-sm font-semibold text-[#70675d] hover:text-[#a04b2b]"
              href={`/store/${cart.items[0].businessSlug}`}
            >
              Back to store
            </Link>
          ) : null}
        </nav>
        <div className="grid gap-12 py-12 md:grid-cols-[.85fr_1.15fr] md:py-20">
          <section>
            <p className="eyebrow text-[#a04b2b]">Secure checkout</p>
            <h1 className="mt-4 font-serif text-6xl leading-none">
              Ready when you are.
            </h1>
            <p className="mt-6 max-w-md text-base leading-7 text-[#70675d]">
              Complete your details and you will be redirected to Paystack to
              finish payment.
            </p>
          </section>
          <section className="border border-[#d9d0c4] bg-[#fffdf9] p-7 sm:p-10">
            {!cart.items.length ? (
              <>
                <h2 className="font-serif text-3xl">Your cart is empty.</h2>
                <Link className="button-dark mt-7" href="/">
                  Find a store
                </Link>
              </>
            ) : (
              <>
                <div className="border-b border-[#ded5ca] pb-5">
                  <p className="eyebrow text-[#70675d]">
                    Order from {cart.items[0].businessName}
                  </p>
                  {cart.items.map((item) => (
                    <div
                      className="mt-4 flex justify-between gap-4 text-sm"
                      key={item.itemId}
                    >
                      <span>
                        {item.name}{" "}
                        <span className="text-[#8c8176]">x{item.quantity}</span>
                      </span>
                      <span className="font-semibold">
                        {money(item.price * item.quantity)}
                      </span>
                    </div>
                  ))}
                  <div className="mt-5 flex justify-between border-t border-[#ded5ca] pt-4 font-semibold">
                    <span>Total</span>
                    <span className="text-[#a04b2b]">{money(cart.total)}</span>
                  </div>
                </div>
                <form className="mt-7 space-y-5" onSubmit={submit}>
                  <label className="field-label">
                    Full name
                    <input
                      className="field-input"
                      required
                      value={form.customerName}
                      onChange={(event) =>
                        setForm({ ...form, customerName: event.target.value })
                      }
                    />
                  </label>
                  <label className="field-label">
                    Phone number
                    <input
                      className="field-input"
                      required
                      value={form.customerPhone}
                      onChange={(event) =>
                        setForm({ ...form, customerPhone: event.target.value })
                      }
                    />
                  </label>
                  <label className="field-label">
                    Email address{" "}
                    <span className="font-normal text-[#8c8176]">optional</span>
                    <input
                      className="field-input"
                      type="email"
                      value={form.customerEmail}
                      onChange={(event) =>
                        setForm({ ...form, customerEmail: event.target.value })
                      }
                    />
                  </label>
                  <fieldset className="field-label">
                    <legend>
                      Delivery address{" "}
                      <span className="font-normal text-[#8c8176]">
                        choose an exact location or nearby area
                      </span>
                    </legend>
                    <div className="grid gap-2 sm:grid-cols-2">
                      <button
                        className={`border px-3 py-3 text-left text-sm font-semibold ${
                          addressMode === "exact"
                            ? "border-[#a04b2b] bg-[#fff4ec] text-[#a04b2b]"
                            : "border-[#d9d0c4]"
                        }`}
                        onClick={useExactLocation}
                        type="button"
                      >
                        Use my exact location
                      </button>
                      <button
                        className={`border px-3 py-3 text-left text-sm font-semibold ${
                          addressMode === "area"
                            ? "border-[#a04b2b] bg-[#fff4ec] text-[#a04b2b]"
                            : "border-[#d9d0c4]"
                        }`}
                        onClick={() => {
                          setAddressMode("area");
                          setLocationStatus("");
                        }}
                        type="button"
                      >
                        Choose a popular area
                      </button>
                    </div>
                    <input
                      ref={addressInputRef}
                      className="field-input"
                      placeholder={
                        mapsKey
                          ? "Search for an address or popular area"
                          : "Enter your delivery address"
                      }
                      required
                      value={form.deliveryAddress}
                      onChange={(event) =>
                        setForm({
                          ...form,
                          deliveryAddress: event.target.value,
                        })
                      }
                    />
                    {locationStatus ? (
                      <span className="font-normal text-[#70675d]">
                        {locationStatus}
                      </span>
                    ) : null}
                  </fieldset>
                  {error ? (
                    <p className="text-sm text-[#a04b2b]">{error}</p>
                  ) : null}
                  <button
                    className="button-dark w-full"
                    disabled={loading}
                    type="submit"
                  >
                    {loading ? "Preparing payment..." : "Continue to payment"}
                  </button>
                </form>
              </>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
