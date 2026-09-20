"use client";
import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";
const sb = createClient(
  "https://xvzupsflasjdejgkcgrt.supabase.co",
  "sb_publishable_ekMMmdmDw5YtFdhHUfh62g_Lz15Pwaf",
);
const sell = (p) =>
  p.wholesale_price ? Math.ceil(Number(p.wholesale_price) * 1.15 * 1.35) : null;
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
function popularityScore(p) {
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
function Brand() {
  return (
    <img className="brandlogo" src="/giftingguru-logo.png" alt="Gifting Guru" />
  );
}
export default function Storefront({ initialItems = [] }) {
  const [items, setItems] = useState(initialItems),
    [q, setQ] = useState(""),
    [cat, setCat] = useState("All"),
    [sort, setSort] = useState("popular"),
    [cart, setCart] = useState([]),
    [open, setOpen] = useState(false),
    [detail, setDetail] = useState(null),
    [photo, setPhoto] = useState(0);
  useEffect(() => {
    if (!initialItems.length)
      sb.from("products")
        .select("*")
        .eq("active", true)
        .order("synced_at", { ascending: false })
        .limit(5000)
        .then(({ data }) => setItems(data || []));
    try {
      setCart(JSON.parse(localStorage.getItem("ggcart") || "[]"));
    } catch {}
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
        (!deferredQ ||
          [x.name, x.sku, x.brand, x.description]
            .join(" ")
            .toLowerCase()
            .includes(deferredQ.toLowerCase())),
    );
    return filtered.sort((a, b) =>
      sort === "price-low"
        ? (sell(a) || Infinity) - (sell(b) || Infinity)
        : sort === "price-high"
          ? (sell(b) || 0) - (sell(a) || 0)
          : sort === "newest"
            ? String(b.synced_at || "").localeCompare(String(a.synced_at || ""))
            : popularityScore(b) - popularityScore(a),
    );
  }, [items, cat, deferredQ, sort]);
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
  function add(p) {
    const price = sell(p);
    if (!price) return;
    setCart((c) => {
      const f = c.find((x) => x.id === p.id);
      return f
        ? c.map((x) => (x.id === p.id ? { ...x, qty: x.qty + 1 } : x))
        : [
            ...c,
            { id: p.id, name: p.name, image: p.image_urls?.[0], price, qty: 1 },
          ];
    });
    setOpen(true);
  }
  function view(p) {
    setDetail(p);
    setPhoto(0);
  }
  const subtotal = cart.reduce((s, x) => s + x.price * x.qty, 0);
  const shipping = subtotal >= 1500 || subtotal === 0 ? 0 : 120;
  const total = subtotal + shipping;
  const freeDeliveryGap = Math.max(0, 1500 - subtotal);
  return (
    <>
      <header className="head">
        <div className="headin">
          <Brand />
          <div className="search">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search gifts, tech, home, brands and SKUs..."
            />
            <button>⌕</button>
          </div>
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
          <h2>{cat === "All" ? "Fresh finds" : cat.replaceAll("-", " ")}</h2>
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
            {(q || cat !== "All" ? shown : shown.slice(0, 18)).map((p) => {
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
                      {soh > 0
                        ? soh < 10
                          ? "Only " + soh + " left"
                          : soh + " in stock"
                        : "Out of stock"}
                    </div>
                    <button
                      className="add"
                      disabled={!price || soh < 1}
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
        <div className="modal" onClick={() => setDetail(null)}>
          <section
            className="productmodal"
            onClick={(e) => e.stopPropagation()}
          >
            <button className="modalclose" onClick={() => setDetail(null)}>
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
                {Number(detail.stock_qty || 0) > 0
                  ? detail.stock_qty + " in stock"
                  : "Out of stock"}
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
                disabled={!sell(detail) || Number(detail.stock_qty || 0) < 1}
                onClick={() => add(detail)}
              >
                Add to cart
              </button>
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
                  <div>Qty {x.qty}</div>
                </div>
                <b>R {(x.price * x.qty).toLocaleString("en-ZA")}</b>
              </div>
            ))}
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
            <button className="checkout" disabled={!cart.length}>
              Checkout
            </button>
          </aside>
        </div>
      )}
    </>
  );
}
