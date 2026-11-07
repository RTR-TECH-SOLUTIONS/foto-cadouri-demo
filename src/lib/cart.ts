// Coș demo în localStorage. TODO(real): coșul vine din backend (Supabase), plata prin Netopia/Stripe.
import { shop } from '../data/shop';

export interface CartItem {
  id: string;
  slug: string;
  name: string;
  price: number;
  qty: number;
  image: string;
  engraving?: string;
}

const KEY = 'fc-cart';
const ORDERS = 'fc-orders';
export const FREE_SHIPPING = shop.freeShipping;
export const SHIPPING = shop.shipping;

export function readCart(): CartItem[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '[]');
  } catch {
    return [];
  }
}

function write(items: CartItem[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(items));
  } catch {
    // storage blocat: păstrăm starea doar pe pagina curentă
  }
  window.dispatchEvent(new CustomEvent('cart:update', { detail: items }));
}

export function addToCart(item: Omit<CartItem, 'id' | 'qty'> & { qty?: number }) {
  const items = readCart();
  const same = items.find((i) => i.slug === item.slug && (i.engraving || '') === (item.engraving || ''));
  if (same) same.qty = Math.min(99, same.qty + (item.qty ?? 1));
  else items.push({ ...item, qty: item.qty ?? 1, id: Math.random().toString(36).slice(2, 10) });
  write(items);
  window.dispatchEvent(new CustomEvent('cart:open'));
}

export function setQty(id: string, qty: number) {
  write(readCart().map((i) => (i.id === id ? { ...i, qty: Math.max(1, Math.min(99, qty)) } : i)));
}

export function removeItem(id: string) {
  write(readCart().filter((i) => i.id !== id));
}

export function clearCart() {
  write([]);
}

export interface Order {
  number: string;
  date: string;
  name: string;
  phone: string;
  delivery: 'ridicare' | 'curier';
  payment: 'card' | 'ramburs' | 'magazin';
  total: number;
  items: { name: string; qty: number; engraving?: string }[];
  status: 'Nouă' | 'În pregătire' | 'Gata de ridicare' | 'Trimisă';
}

export function saveOrder(o: Order) {
  try {
    const list: Order[] = JSON.parse(localStorage.getItem(ORDERS) || '[]');
    localStorage.setItem(ORDERS, JSON.stringify([o, ...list].slice(0, 20)));
  } catch {
    // ignorat în demo
  }
}

export function readOrders(): Order[] {
  try {
    return JSON.parse(localStorage.getItem(ORDERS) || '[]');
  } catch {
    return [];
  }
}

export const subtotal = (items: CartItem[]) => items.reduce((s, i) => s + i.price * i.qty, 0);
export const shippingFor = (sub: number, delivery: 'ridicare' | 'curier' = 'curier') =>
  delivery === 'ridicare' || sub === 0 || sub >= FREE_SHIPPING ? 0 : SHIPPING;
export const fmt = (n: number) =>
  `${n.toLocaleString('ro-RO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} lei`;
