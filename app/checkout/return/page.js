import Link from "next/link";
import { cookies } from "next/headers";
import { createServerClient } from "../../lib/pricing";
import { confirmOrderPayment } from "../../lib/stitch";
import ClearCart from "./clear-cart";

export const dynamic = "force-dynamic";
export const metadata = { title: "Payment status | GiftingGuru", robots: { index: false } };

const ORDER_NUMBER = /^GG-\d{8}-[A-Z0-9]{8}$/;

async function loadOrder(orderNumber) {
  if (!ORDER_NUMBER.test(orderNumber || "") || !process.env.SUPABASE_SERVICE_ROLE_KEY) return null;
  const db = createServerClient();
  const { data: order } = await db.from("orders").select("*").eq("order_number", orderNumber).maybeSingle();
  if (!order) return null;
  try {
    return await confirmOrderPayment(db, order);
  } catch (error) {
    console.error("return page confirm failed", orderNumber, error?.message);
    return order;
  }
}

export default async function CheckoutReturnPage({ searchParams }) {
  const params = await searchParams;
  const cookieStore = await cookies();
  // The order number comes only from our own httpOnly cookie, so a shared link can't reveal someone else's order.
  const order = await loadOrder(cookieStore.get("gg_order")?.value);
  const total = order ? "R " + Number(order.total).toLocaleString("en-ZA") : null;

  let view;
  if (!order) {
    view = (
      <>
        <h1>We couldn&apos;t find your order</h1>
        <p>If you completed a payment, you will receive an email confirmation. Contact us with your order reference if you need help.</p>
      </>
    );
  } else if (order.payment_status === "paid") {
    view = (
      <>
        <ClearCart />
        <span className="confirmicon">✓</span>
        <h1>Payment received</h1>
        <p>Thank you. Your order <b>{order.order_number}</b> is confirmed and is now being prepared for dispatch.</p>
        <p>Total paid: <b>{total}</b></p>
      </>
    );
  } else if (order.payment_status === "failed") {
    view = (
      <>
        <h1>Payment not completed</h1>
        <p>The payment for order <b>{order.order_number}</b> expired or was cancelled. No money was taken. Your cart is still saved, so you can check out again.</p>
      </>
    );
  } else {
    view = (
      <>
        <h1>Confirming your payment</h1>
        <p>We haven&apos;t received confirmation for order <b>{order.order_number}</b> yet. If you just paid, this can take a few seconds.</p>
        <p><Link href={"/checkout/return?check=" + Date.now()}>Check again</Link></p>
      </>
    );
  }

  return (
    <main className="infopage">
      <Link href="/" className="back">← Back to GiftingGuru</Link>
      <section className="orderconfirmation">
        {view}
        {params?.status && order?.payment_status !== "paid" ? <p className="paymentnotice">Stitch status: {String(params.status).slice(0, 40)}</p> : null}
        <p><Link href="/" className="checkout">Continue shopping</Link></p>
      </section>
    </main>
  );
}
