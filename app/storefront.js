"use client";
import { useDeferredValue, useEffect, useMemo, useState } from "react";
import GiftReminder from "./gift-reminder";
import { captureAttribution, getAttribution, track } from "./lib/analytics";
// Retail price is calculated on the server; the browser never receives cost or markup data.
const sell = (p) => p.retail_price ?? null;
const isAvailable = (p) => p.available ?? (Boolean(p.retail_price) && Number(p.stock_qty || 0) > 0);
const demandSignals = [
  [/(true wireless|tws|earbud)/i, 120],
  [/(bluetooth.*headphone|wireless.*headphone)/i, 110],
  [/(power bank|10000mah|20000mah)/i, 105],
  [/(fast charger|wall charger|usb-c charger|type-c charger)/i, 95],
  [/(bluetooth speaker|portable speaker)/i, 90],
  [/(smart watch|smartwatch|fitness watch)/i, 88],
  [/(gaming|gamepad|controller)/i, 78],
  [/(router|wi-fi|wifi|mesh)/i, 74],
  [/(laptop bag|backpack|computer accessory)/i, 65],
  [/(air fryer|kitchen appliance)/i, 62],
  [/(security camera|smart home)/i, 58],
  [/(kids|school|education)/i, 42],
];
const heroSkus = new Set([
  "VK-2002-BK",
  "VK-9021-BK",
  "VK-1158-WT",
  "VK-3453-BK[V2]",
  "VK-5018-GN",
  "VK-8063-WT",
]);
function popularityScore(p, store) {
  const text = [p.name, p.brand, p.category_path, p.description].join(" ");
  let score = 0;
  for (const [pattern, weight] of demandSignals)
    if (pattern.test(text)) score += weight;
  const stock = Number(p.stock_qty || 0),
    price = sell(p) || 0;
  if (stock > 0) score += 25;
  if (stock > 20) score += Math.min(25, Math.log10(stock + 1) * 10);
  if (price >= 150 && price <= 1500) score += 18;
  if (/volkano|amplify|switched|tp-link|eiger|rocka/i.test(text)) score += 15;
  if (heroSkus.has(p.sku)) score += 80;
  return score;
}
function Brand({ logoUrl = "/giftingguru-logo.png", name = "Gifting Guru" }) {
  return (
    <img className="brandlogo" src={logoUrl} alt={name} />
  );
}
// Every word in the query must appear somewhere in the product (any order).
function matchesSearch(product, query) {
  const words = String(query || "").toLowerCase().split(/\s+/).filter(Boolean);
  if (!words.length) return true;
  const haystack = [product.name, product.sku, product.brand, product.category_path, product.description]
    .join(" ")
    .toLowerCase()
    .replace(/[-_/]/g, " ");
  return words.every((word) => haystack.includes(word.replace(/[-_/]/g, " ")));
}

export default function Storefront({ initialItems = [], store }) {
  const [items, setItems] = useState(() => [...new Map(initialItems.map((product) => [product.id, product])).values()]),
    [q, setQ] = useState(""),
    [cat, setCat] = useState("All"),
    [sort, setSort] = useState("popular"),
    [cart, setCart] = useState([]),
    [open, setOpen] = useState(false),
    [checkoutOpen, setCheckoutOpen] = useState(false),
    [checkoutBusy, setCheckoutBusy] = useState(false),
    [checkoutMessage, setCheckoutMessage] = useState(""),
    [orderResult, setOrderResult] = useState(null),
    [detail, setDetail] = useState(null),
    [photo, setPhoto] = useState(0),
    [shareNote, setShareNote] = useState("");
  useEffect(() => {
    captureAttribution();
    // Restore the cart, refreshing prices and dropping items that are no longer available.
    let saved = [];
    try {
      saved = JSON.parse(localStorage.getItem("ggcart") || "[]");
    } catch {}
    const byId = new Map(items.map((p) => [p.id, p]));
    let restored = saved.flatMap((item) => {
      const live = byId.get(item.id);
      if (items.length && (!live || !isAvailable(live))) return [];
      return [live ? { ...item, sku: live.sku, price: sell(live), qty: Math.min(item.qty, Math.max(1, Number(live.stock_qty || 1))) } : item];
    });
    // Deep links: ?q=search  ?p=SKU (open product)  ?add=SKU (add to cart)
    const params = new URLSearchParams(window.location.search);
    const bySku = (sku) => items.find((p) => String(p.sku).toLowerCase() === String(sku || "").toLowerCase());
    if (params.get("q")) {
      setQ(params.get("q").slice(0, 80));
      setTimeout(() => document.getElementById("shop")?.scrollIntoView(), 50);
    }
    const addSku = bySku(params.get("add"));
    if (addSku && isAvailable(addSku)) {
      if (!restored.some((x) => x.id === addSku.id)) restored = [...restored, cartLine(addSku)];
      track("add_to_cart", { sku: addSku.sku, name: addSku.name, value: sell(addSku), price: sell(addSku) });
      setOpen(true);
      params.delete("add");
      window.history.replaceState(null, "", window.location.pathname + (params.toString() ? "?" + params : "") + window.location.hash);
    }
    setCart(restored);
    const openSku = bySku(params.get("p"));
    if (openSku) {
      setDetail(openSku);
      track("view_item", { sku: openSku.sku, name: openSku.name, value: sell(openSku), price: sell(openSku) });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    localStorage.setItem("ggcart", JSON.stringify(cart));
  }, [cart]);
  const cats = useMemo(
    () => [
      "All",
      ...new Set(
        items
          .map((x) => (x.category_path || "").split("/").filter(Boolean)[0])
          .filter(Boolean),
      ),
    ],
    [items],
  );
  const deferredQ = useDeferredValue(q);
  const shown = useMemo(() => {
    const filtered = items.filter(
      (x) =>
        (cat === "All" || (x.category_path || "").includes(cat)) &&
        matchesSearch(x, deferredQ),
    );
    return filtered.sort((a, b) =>
      sort === "price-low"
        ? (sell(a) || Infinity) - (sell(b) || Infinity)
        : sort === "price-high"
          ? (sell(b) || 0) - (sell(a) || 0)
          : sort === "newest"
            ? String(b.synced_at || "").localeCompare(String(a.synced_at || ""))
            : popularityScore(b, store) - popularityScore(a, store),
    );
  }, [items, cat, deferredQ, sort, store]);
  const categoryCards = useMemo(
    () =>
      cats
        .filter((x) => x !== "All")
        .slice(0, 8)
        .map((name, i) => ({
          name,
          item: items.find((x) => (x.category_path || "").includes(name)),
          tone: ["yellow", "pink", "blue", "green"][i % 4],
        })),
    [cats, items],
  );
  const brandDefs = [
    [
      "Volkano",
      "https://odo-cdn.imgix.net/catalog/product/169/331/1693319117.6718.png?auto=compress%2Cformat&bg=fff&fit=fill&h=800&w=800",
    ],
    [
      "Switched",
      "https://content.storefront7.co.za/stores/za.co.storefront7.smd/pictures/638155279099728930/24-1-280x280-%28280x280%29.png?cache=always&height=500&width=500",
    ],
    [
      "Edu-matic",
      "https://content.storefront7.co.za/stores/za.co.storefront7.smd/pictures/638949261911802118/edumatic-%28500x500%29.jpg?cache=always",
    ],
    [
      "Kingsons",
      "https://files.sophie.co.ke/2025/09/3122871139_8054_3065.webp",
    ],
  ];
  const brandProducts = (n) =>
    items
      .filter(
        (x) =>
          (x.name || "").toLowerCase().includes(n.toLowerCase()) ||
          (x.brand || "").toLowerCase() === n.toLowerCase(),
      )
      .slice(0, 6);
  function chooseBrand(n) {
    setQ(n);
    setCat("All");
    document.getElementById("shop")?.scrollIntoView();
  }
  function cartLine(p) {
    return { id: p.id, sku: p.sku, name: p.name, image: p.image_urls?.[0], price: sell(p), qty: 1, digital: String(p.category_path || "").toLowerCase() === "digital" };
  }
  function setProductParam(sku) {
    const params = new URLSearchParams(window.location.search);
    if (sku) params.set("p", sku); else params.delete("p");
    window.history.replaceState(null, "", window.location.pathname + (params.toString() ? "?" + params : "") + window.location.hash);
  }
  function closeDetail() {
    setDetail(null);
    setProductParam(null);
  }
  async function shareProduct(p) {
    const url = `${window.location.origin}/products/${encodeURIComponent(p.sku)}`;
    try {
      if (navigator.share) await navigator.share({ title: p.name, url });
      else { await navigator.clipboard.writeText(url); setShareNote("Link copied"); setTimeout(() => setShareNote(""), 2000); }
    } catch {}
  }
  function add(p) {
    const price = sell(p);
    if (!price || !isAvailable(p)) return;
    track("add_to_cart", { sku: p.sku, name: p.name, value: price, price });
    setCart((c) => {
      const f = c.find((x) => x.id === p.id);
      return f
        ? c.map((x) => (x.id === p.id ? { ...x, qty: x.qty + 1 } : x))
        : [...c, cartLine(p)];
    });
    setOpen(true);
  }
  function changeQuantity(id, quantity) {
    setCart((current) => current.flatMap((item) =>
      item.id !== id ? [item] : quantity > 0 ? [{ ...item, qty: quantity }] : []
    ));
  }
  function view(p) {
    setDetail(p);
    setPhoto(0);
    setProductParam(p.sku);
    track("view_item", { sku: p.sku, name: p.name, value: sell(p), price: sell(p) });
  }
  const subtotal = cart.reduce((s, x) => s + x.price * x.qty, 0);
  const digitalOnly = cart.length > 0 && cart.every((item) => item.digital);
  const shipping = digitalOnly || subtotal >= 1500 || subtotal === 0 ? 0 : 120;
  const total = subtotal + shipping;
  const freeDeliveryGap = Math.max(0, 1500 - subtotal);
  async function submitCheckout(event) {
    event.preventDefault();
    setCheckoutBusy(true);
    setCheckoutMessage("");
    const form = new FormData(event.currentTarget);
    const payload = {
      items: cart.map(({ id, qty }) => ({ id, qty })),
      customer: {
        firstName: form.get("firstName"), lastName: form.get("lastName"),
        email: form.get("email"), phone: form.get("phone"),
      },
      shippingAddress: {
        recipient: `${form.get("firstName")} ${form.get("lastName")}`,
        line1: form.get("line1"), line2: form.get("line2"), suburb: form.get("suburb"),
        city: form.get("city"), province: form.get("province"), postalCode: form.get("postalCode"),
      },
      attribution: getAttribution(),
    };
    try {
      const response = await fetch("/api/checkout/create", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Checkout could not be completed.");
      if (result.payment?.url) {
        window.location.assign(result.payment.url);
        return;
      }
      setOrderResult(result);
      setCart([]);
    } catch (error) { setCheckoutMessage(error.message); }
    finally { setCheckoutBusy(false); }
  }
  return (
    <>
      <header className="head">
        <div className="headin">
          <Brand logoUrl={store?.branding?.logoUrl} name={store?.name} />
          <form
            className="search"
            role="search"
            onSubmit={(e) => {
              e.preventDefault();
              setCat("All");
              document.getElementById("shop")?.scrollIntoView({ behavior: "smooth" });
            }}
          >
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search gifts, tech, home, brands and SKUs..."
              aria-label="Search products"
            />
            <button type="submit" aria-label="Search">⌕</button>
          </form>
          <div className="actions">
            <button className="account">
              ♙ <span>Sign In</span>
            </button>
            <button className="wish">
              ♡ <span>Wishlist</span>
            </button>
            <button className="cartbtn" onClick={() => setOpen(true)}>
              🛒 <span>Cart</span> <b>{cart.reduce((s, x) => s + x.qty, 0)}</b>
            </button>
          </div>
        </div>
      </header>
      <nav className="cats">
        <div className="catin">
          <button className="shopcat">☰ Shop by Category</button>
          <a href="#brands">Brands</a>
          <a href="#shop">Deals</a>
          <a href="#shop">New Arrivals</a>
          <a href="#shop">Best Sellers</a>
          <a href="#explore">Gift Ideas</a>
          <span className="navspacer" />
          <small>
            ▣ <b>Nationwide Delivery</b>
            <em>R120 · Free over R1 500</em>
          </small>
          <small>
            ♢ <b>Secure Checkout</b>
            <em>Online payments</em>
          </small>
          <small>
            ◉ <b>Need Help?</b>
            <em>Contact Us</em>
          </small>
        </div>
      </nav>
      <GiftReminder />
      <section className="categorysection" id="explore">
        <div className="sectionhead">
          <h2>Shop by Category</h2>
        </div>
        <div className="categorycircles">
          {categoryCards
            .concat(
              cats
                .slice(9, 14)
                .map((name, i) => ({
                  name,
                  item: items.find((x) =>
                    (x.category_path || "").includes(name),
                  ),
                  tone: ["pink", "blue", "green", "yellow"][i % 4],
                })),
            )
            .slice(0, 13)
            .map((c) => (
              <button
                key={c.name}
                onClick={() => {
                  setCat(c.name);
                  document.getElementById("shop")?.scrollIntoView();
                }}
              >
                <span className={"circle " + c.tone}>
                  {c.item?.image_urls?.[0] && (
                    <img src={c.item.image_urls[0]} alt="" />
                  )}
                </span>
                <b>{c.name.replaceAll("-", " ")}</b>
              </button>
            ))}
        </div>
      </section>
      <section className="hero">
        <a className="referenceHero" href="#shop" aria-label="Shop GiftingGuru">
          <img src="/reference-hero.webp" alt="Great gifts. Brighter days." />
        </a>
      </section>
      <section className="brands" id="brands">
        <div className="sectionhead">
          <h2>Brands We Love</h2>
          <button
            className="viewbrands"
            onClick={() => document.getElementById("shop")?.scrollIntoView()}
          >
            View All Brands →
          </button>
        </div>
        <div className="brandlogoStrip">
          <div className="brandNames" aria-label="Featured brands">
            {[
              "volkano",
              "ROCKA",
              "ⒶMPLIFY",
              "EIGER",
              "⏻ switched",
              "connex CONNECT",
              "K | KINGSONS",
              "▣ EDUMATIC",
            ].map((n) => (
              <span key={n}>{n}</span>
            ))}
          </div>
          <div className="brandHotspots">
            {[
              "Volkano",
              "Rocka",
              "Amplify",
              "Eiger",
              "Switched",
              "Connex",
              "Kingsons",
              "Edu-matic",
            ].map((n) => (
              <button
                key={n}
                aria-label={"Shop " + n}
                onClick={() => chooseBrand(n)}
              />
            ))}
          </div>
        </div>
      </section>
      <section className="showcase">
        <div className="showcasehead">
          <div></div>
          <button onClick={() => chooseBrand("Volkano")}>
            View All Volkano →
          </button>
        </div>
        <div className="showcasegrid">
          <button
            className="showcasebrand referenceVolkano"
            aria-label="Shop Volkano"
            onClick={() => chooseBrand("Volkano")}
          ></button>
          {brandProducts("Volkano")
            .slice(0, 5)
            .map((p) => (
              <article className="showcard" key={p.id} onClick={() => view(p)}>
                {p.image_urls?.[0] && (
                  <img src={p.image_urls[0]} alt={p.name} />
                )}
                <div>
                  <span>{p.name}</span>
                  <b>R {sell(p)?.toLocaleString("en-ZA")}</b>
                </div>
              </article>
            ))}
        </div>
      </section>
      <section className="promorow">
        <button
          className="promocard referenceGifts"
          aria-label="Shop gifts"
          onClick={() => document.getElementById("explore")?.scrollIntoView()}
        ></button>
        <button
          className="promocard referenceGaming"
          aria-label="Shop gaming"
          onClick={() => {
            setQ("gaming");
            document.getElementById("shop")?.scrollIntoView();
          }}
        ></button>
        <button
          className="promocard referenceOffice"
          aria-label="Shop office and technology"
          onClick={() => {
            setQ("computer");
            document.getElementById("shop")?.scrollIntoView();
          }}
        ></button>
      </section>
      <section className="section" id="shop">
        <div className="sectionhead">
          <h2>{q ? `Results for "${q}"` : cat === "All" ? "Fresh finds" : cat.replaceAll("-", " ")}</h2>
          <div className="shopcontrols">
            <span>{shown.length} products</span>
            <label>
              Sort{" "}
              <select value={sort} onChange={(e) => setSort(e.target.value)}>
                <option value="popular">Most popular</option>
                <option value="newest">Newest</option>
                <option value="price-low">Price: low to high</option>
                <option value="price-high">Price: high to low</option>
              </select>
            </label>
          </div>
        </div>
        {shown.length ? (
          <div className="grid">
            {(q ? shown.slice(0, 120) : cat !== "All" ? shown : shown.slice(0, 18)).map((p) => {
              const price = sell(p),
                soh = Number(p.stock_qty || 0);
              return (
                <article className="card" key={p.id} onClick={() => view(p)}>
                  <span className="badge">
                    {(p.name || "").split(" ")[0] || "GiftingGuru"}
                  </span>
                  <div className="pic">
                    {p.image_urls?.[0] && (
                      <img src={p.image_urls[0]} alt={p.name} />
                    )}
                  </div>
                  <div className="cardbody">
                    <div className="sku">{p.sku}</div>
                    <div className="title">{p.name}</div>
                    <div className="price">
                      {price
                        ? "R " + price.toLocaleString("en-ZA")
                        : "Price updating"}
                    </div>
                    <div className={"stock " + (soh < 10 ? "low" : "")}>
                      {isAvailable(p)
                        ? soh < 10
                          ? "Only " + soh + " left"
                          : soh + " in stock"
                        : "Out of stock"}
                    </div>
                    <button
                      className="add"
                      disabled={!isAvailable(p)}
                      onClick={(e) => {
                        e.stopPropagation();
                        add(p);
                      }}
                    >
                      Add to cart
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="empty">No products match this selection.</div>
        )}
      </section>
      <footer className="footer">
        <div className="foot">
          <div>
            <Brand />
            <p>Bright gifting, tech and lifestyle finds for South Africa.</p>
          </div>
          <div>
            <h4>Shop</h4>
            <p>
              <a href="/#shop">All products</a>
            </p>
            <p>
              <a href="/#brands">Brands</a>
            </p>
            <p>
              <a href="/#shop">New arrivals</a>
            </p>
          </div>
          <div>
            <h4>Help</h4>
            <p>
              <a href="/contact">Contact us</a>
            </p>
            <p>
              <a href="/shipping">Shipping</a>
            </p>
            <p>
              <a href="/returns">Returns</a>
            </p>
          </div>
          <div>
            <h4>Company</h4>
            <p>
              <a href="/about">About GiftingGuru</a>
            </p>
            <p>
              <a href="/terms">Terms & Conditions</a>
            </p>
            <p>
              <a href="/privacy">Privacy Policy</a>
            </p>
          </div>
        </div>
      </footer>
      {detail && (
        <div className="modal" onClick={closeDetail}>
          <section
            className="productmodal"
            onClick={(e) => e.stopPropagation()}
          >
            <button className="modalclose" onClick={closeDetail}>
              ×
            </button>
            <div className="gallery">
              <div
                className="mainphoto"
                onClick={() => document.documentElement.requestFullscreen?.()}
              >
                {detail.image_urls?.[photo] && (
                  <img src={detail.image_urls[photo]} alt={detail.name} />
                )}
                <span>Click image to enlarge</span>
              </div>
              {detail.image_urls?.length > 1 && (
                <div className="thumbs">
                  {detail.image_urls.map((im, i) => (
                    <button
                      className={photo === i ? "selected" : ""}
                      key={im}
                      onClick={() => setPhoto(i)}
                    >
                      <img src={im} />
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="productinfo">
              <span className="productbrand">
                {detail.brand || "GiftingGuru"}
              </span>
              <h1>{detail.name}</h1>
              <div className="detailSku">SKU {detail.sku}</div>
              <div className="detailPrice">
                R {sell(detail)?.toLocaleString("en-ZA")}
              </div>
              <div className="detailStock">
                {isAvailable(detail)
                  ? detail.stock_qty + " in stock"
                  : "Currently unavailable"}
              </div>
              {detail.description && (
                <div className="description">{detail.description}</div>
              )}
              <div className="detailsbox">
                <b>Product details</b>
                <p>
                  Category: {(detail.category_path || "").replaceAll("-", " ")}
                </p>
                <p>Stock is synchronized from our supplier catalogue.</p>
              </div>
              <button
                className="bigadd"
                disabled={!isAvailable(detail)}
                onClick={() => add(detail)}
              >
                {isAvailable(detail) ? "Add to cart" : "Currently unavailable"}
              </button>
              <div className="sharerow">
                <button type="button" className="sharelink" onClick={() => shareProduct(detail)}>
                  {shareNote || "Share this product"}
                </button>
                <a className="sharelink" href={`/products/${encodeURIComponent(detail.sku)}`}>Open product page</a>
              </div>
            </div>
          </section>
        </div>
      )}
      {open && (
        <div className="drawer" onClick={() => setOpen(false)}>
          <aside className="drawerbox" onClick={(e) => e.stopPropagation()}>
            <div className="drawerhead">
              <h2>Your cart</h2>
              <button className="close" onClick={() => setOpen(false)}>
                ×
              </button>
            </div>
            {cart.map((x) => (
              <div className="cartrow" key={x.id}>
                {x.image ? <img src={x.image} /> : <div />}
                <div>
                  <b>{x.name}</b>
                  <div className="cartquantity" aria-label={`Quantity for ${x.name}`}>
                    <button type="button" aria-label={`Decrease quantity of ${x.name}`} onClick={() => changeQuantity(x.id, x.qty - 1)}>−</button>
                    <span>Qty {x.qty}</span>
                    <button type="button" aria-label={`Increase quantity of ${x.name}`} onClick={() => changeQuantity(x.id, x.qty + 1)}>+</button>
                    <button type="button" className="cartremove" onClick={() => changeQuantity(x.id, 0)}>Remove</button>
                  </div>
                </div>
                <b>R {(x.price * x.qty).toLocaleString("en-ZA")}</b>
              </div>
            ))}
            {cart.length === 0 && <p>Your cart is empty.</p>}
            {cart.length > 0 && (
              <div className="shippingnotice">
                {freeDeliveryGap > 0
                  ? `Add R ${freeDeliveryGap.toLocaleString("en-ZA")} more for free delivery.`
                  : "You qualify for free nationwide delivery."}
              </div>
            )}
            <div className="cartsummary">
              <div>
                <span>Subtotal</span>
                <span>R {subtotal.toLocaleString("en-ZA")}</span>
              </div>
              <div>
                <span>Delivery</span>
                <span>
                  {shipping
                    ? `R ${shipping.toLocaleString("en-ZA")}`
                    : cart.length
                      ? "FREE"
                      : "R 0"}
                </span>
              </div>
            </div>
            <div className="total">
              <span>Total</span>
              <span>R {total.toLocaleString("en-ZA")}</span>
            </div>
            <button className="checkout" disabled={!cart.length} onClick={() => { setOpen(false); setCheckoutOpen(true); track("begin_checkout", { value: total, skus: cart.map((x) => x.sku).filter(Boolean) }); }}>
              Checkout
            </button>
          </aside>
        </div>
      )}
      {checkoutOpen && (
        <div className="modal checkoutmodal" onClick={() => !checkoutBusy && setCheckoutOpen(false)}>
          <section className="checkoutpanel" onClick={(event) => event.stopPropagation()}>
            <button className="modalclose" onClick={() => setCheckoutOpen(false)}>×</button>
            {orderResult ? (
              <div className="orderconfirmation">
                <span className="confirmicon">✓</span>
                <h2>Order request received</h2>
                <p>Your reference is <b>{orderResult.order.order_number}</b>.</p>
                <p>Secure online payment is being activated. No payment has been taken and the order will not be sent to the supplier until payment is confirmed.</p>
                <div className="checkouttotals"><span>Total</span><b>R {Number(orderResult.order.total).toLocaleString("en-ZA")}</b></div>
                <button className="checkout" onClick={() => { setCheckoutOpen(false); setOrderResult(null); }}>Continue shopping</button>
              </div>
            ) : (
              <form onSubmit={submitCheckout}>
                <h2>Secure checkout</h2>
                <p className="checkoutintro">Enter your delivery details. Prices, stock and delivery are verified again before the order is created.</p>
                <h3>Contact details</h3>
                <div className="checkoutgrid">
                  <label>First name<input name="firstName" required autoComplete="given-name" /></label>
                  <label>Last name<input name="lastName" required autoComplete="family-name" /></label>
                  <label>Email<input name="email" type="email" required autoComplete="email" /></label>
                  <label>Mobile number<input name="phone" required autoComplete="tel" /></label>
                </div>
                <h3>Delivery address</h3>
                <div className="checkoutgrid">
                  <label className="wide">Street address<input name="line1" required autoComplete="address-line1" /></label>
                  <label className="wide">Apartment, unit or complex<input name="line2" autoComplete="address-line2" /></label>
                  <label>Suburb<input name="suburb" autoComplete="address-level3" /></label>
                  <label>City<input name="city" required autoComplete="address-level2" /></label>
                  <label>Province<select name="province" required defaultValue=""><option value="" disabled>Select province</option><option>Eastern Cape</option><option>Free State</option><option>Gauteng</option><option>KwaZulu-Natal</option><option>Limpopo</option><option>Mpumalanga</option><option>North West</option><option>Northern Cape</option><option>Western Cape</option></select></label>
                  <label>Postal code<input name="postalCode" required inputMode="numeric" autoComplete="postal-code" /></label>
                </div>
                <div className="checkouttotals"><span>Subtotal</span><b>R {subtotal.toLocaleString("en-ZA")}</b><span>Nationwide delivery</span><b>{shipping ? `R ${shipping}` : "FREE"}</b><span>Total</span><b>R {total.toLocaleString("en-ZA")}</b></div>
                {checkoutMessage && <div className="checkouterror">{checkoutMessage}</div>}
                <button className="checkout" disabled={checkoutBusy}>{checkoutBusy ? "Preparing secure payment..." : "Continue to secure payment"}</button>
                <p className="paymentnotice">You will be taken to Stitch, our secure payment partner, to complete your payment.</p>
              </form>
            )}
          </section>
        </div>
      )}
    </>
  );
}
