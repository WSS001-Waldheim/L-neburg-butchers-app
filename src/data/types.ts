import type { OrderPaymentFields } from '../payments/types';
import type { PopFulfilmentStatus } from '../pop/types';

/** Catalogue section — keep Premium VSP distinct from Braai Boxes. */
export type ProductSection = 'premium-vsp' | 'braai-boxes' | 'sausages';

export type StockStatus = 'in_stock' | 'low' | 'out_of_stock';

/** Legacy delivery modes — still available alongside POP collect. */
export type FulfilmentMethod =
  | 'pop_collect'
  | 'local_delivery'
  | 'whatsapp_pickup'
  | 'pretoria_delivery';

export interface CarcassBatch {
  id: string;
  earTag: string;
  carcassNumber: string;
  qrCode: string;
  breed: string;
  bornAt: string;
  raisedAt: string;
  finishedAt: string;
  processedAt: string;
  story: string;
  butchersNote: string;
}

export interface Product {
  id: string;
  name: string;
  section: ProductSection;
  description: string;
  priceCents: number;
  unitLabel: string;
  weightGrams?: number;
  cutNotes?: string;
  imageHint: string;
  stockLevel: number;
  lowStockThreshold: number;
  nextArrivalAt: string | null;
  carcassBatchId: string | null;
}

export interface CartItem {
  productId: string;
  quantity: number;
}

export interface OrderLine {
  productId: string;
  productName: string;
  quantity: number;
  unitPriceCents: number;
}

export type OrderStatusEvent = {
  id: string;
  orderId: string;
  fromStatus?: PopFulfilmentStatus | null;
  toStatus: PopFulfilmentStatus;
  createdAt: string;
  actorRole?: string;
  note?: string | null;
  collectionCode?: string | null;
};

export interface Order extends OrderPaymentFields {
  id: string;
  orderRef: string;
  createdAt: string;
  customerName: string;
  phone: string;
  email?: string;
  notes?: string;
  lines: OrderLine[];
  totalCents: number;
  /** Preferred fulfilment mode; Phase 1 primary = pop_collect. */
  fulfilment: FulfilmentMethod;
  /** POP collect — required when fulfilment === pop_collect. */
  popId?: string;
  fulfilmentStatus: PopFulfilmentStatus;
  collectionCode?: string;
  collectionCodeExpiresAt?: string;
  assignedAt?: string;
  dispatchedAt?: string;
  readyAt?: string;
  collectedAt?: string;
  collectedByUserId?: string;
  collectorNote?: string;
  packCheckAcceptedAt: string;
  coldChainClockStartedAt?: string;
  statusEvents: OrderStatusEvent[];
  whatsappStub?: boolean;
  pickupLocation?: string;
}

export function getStockStatus(product: Product): StockStatus {
  if (product.stockLevel <= 0) return 'out_of_stock';
  if (product.stockLevel <= product.lowStockThreshold) return 'low';
  return 'in_stock';
}

export function requireNextArrival(product: Product): string {
  const status = getStockStatus(product);
  if (status === 'in_stock') {
    return product.nextArrivalAt ?? '';
  }
  if (!product.nextArrivalAt) {
    throw new Error(
      `Product ${product.id} is ${status} but missing nextArrivalAt — stock rule violation`
    );
  }
  return product.nextArrivalAt;
}

export function formatPrice(cents: number): string {
  return `R${(cents / 100).toFixed(2)}`;
}

export function formatArrivalDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-ZA', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}
