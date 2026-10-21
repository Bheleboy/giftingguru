import Link from "next/link";
import { priceText, productPath } from "../lib/seo";

export function HubHeader() {
  return (
    <header className="hubhead">
      <div className="hubheadin">
        <Link href="/" aria-label="GiftingGuru home">
          <img src="/giftingguru-logo.png" alt="GiftingGuru" width="200" height="56" />
        </Link>
        <nav aria-label="Browse">
          <Link href="/shop">Shop by category</Link>
          <Link href="/brands">Brands</Link>
          <Link href="/gift-reminders">Gift reminders</Link>
        </nav>
      </div>
    </header>
  );
}

export function Crumbs({ trail }) {
  return (
    <nav className="hubcrumbs" aria-label="Breadcrumb">
      {trail.map((t, i) => (
        <span key={t.path}>
          {i < trail.length - 1 ? <Link href={t.path}>{t.name}</Link> : <span aria-current="page">{t.name}</span>}
          {i < trail.length - 1 ? <span className="sep">/</span> : null}
        </span>
      ))}
    </nav>
  );
}

export function ProductGrid({ items, eager = 8 }) {
  return (
    <ul className="hubgrid">
      {items.map((p, i) => (
        <li key={p.id}>
          <Link href={productPath(p)} className={"hubcard" + (p.available ? "" : " soldout")}>
            <span className="hubpic">
              {p.image_urls?.[0] ? (
                <img src={p.image_urls[0]} alt={p.name} loading={i < eager ? "eager" : "lazy"} decoding="async" />
              ) : null}
            </span>
            <span className="hubname">{p.name}</span>
            <span className="hubprice">{priceText(p)}</span>
            <span className="hubstock">{p.available ? "In stock" : "Out of stock"}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

export function TileList({ tiles, base }) {
  return (
    <ul className="hubtiles">
      {tiles.map((t) => (
        <li key={t.slug}>
          <Link href={`${base}/${t.slug}`}>
            <strong>{t.label}</strong>
            <span>{t.items.length} products</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

export function HubFooter() {
  return (
    <footer className="hubfoot">
      <div className="hubfootin">
        <p>GiftingGuru delivers gifts, tech and home essentials across South Africa. Flat R120 delivery, free over R1 500. Secure checkout.</p>
        <nav aria-label="Help">
          <Link href="/shipping">Shipping</Link>
          <Link href="/returns">Returns</Link>
          <Link href="/contact">Contact</Link>
          <Link href="/about">About</Link>
        </nav>
      </div>
    </footer>
  );
}
