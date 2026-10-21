// Fixed rand formatting ("R 5 467"), identical on the server and in every browser.
// Locale formatting (toLocaleString) differs between Node and browsers and breaks hydration.
const NBSP = " ";

export function groupDigits(value) {
  const n = Math.round(Number(value || 0));
  return String(Math.abs(n)).replace(/\B(?=(\d{3})+(?!\d))/g, NBSP).replace(/^/, n < 0 ? "-" : "");
}

export function rands(value) {
  return `R${NBSP}${groupDigits(value)}`;
}
