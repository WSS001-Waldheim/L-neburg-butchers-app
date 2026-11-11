import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useAuth } from '../auth/AuthContext';
import { DEMO_ORDERS, getProduct as seedGetProduct } from '../data/seed';
import { fetchOrders, saveOrder } from '../data/remoteStore';
import { isSupabaseConfigured } from '../data/supabaseClient';
import {
  canSetStoreStatus,
  fulfilmentForStoreStatus,
  storeStatusForFulfilment,
} from '../data/storeStatus';
import type {
  CartItem,
  FulfilmentMethod,
  Order,
  OrderLine,
  OrderStatusEvent,
  StoreOrderStatus,
} from '../data/types';
import {
  dispatchStub,
  getStubInbox,
  type StubInboxItem,
} from '../notifications/StubNotificationDispatcher';
import { mapStatusToNotifications } from '../notifications/mapStatusToNotifications';
import {
  applyPaymentResult,
  unpaidPaymentFields,
} from '../payments/orderPaymentFields';
import type { OrderPaymentFields, PaymentResult } from '../payments/types';
import {
  collectionCodesMatch,
  generateCollectionCode,
} from '../pop/collectionCode';
import { findPop } from '../pop/popStore';
import { assertTransition } from '../pop/statusMachine';
import type { AuthUser, PopFulfilmentStatus } from '../pop/types';
import { useCatalog } from './CatalogContext';

type PlaceOrderInput = {
  customerName: string;
  phone: string;
  email?: string;
  notes?: string;
  fulfilment: FulfilmentMethod;
  popId?: string;
  packCheckAcceptedAt: string;
  paymentResult?: PaymentResult;
  /** Create the order as awaiting payment. Used before the Yoco redirect. */
  deferPayment?: boolean;
  actor: AuthUser;
};

type OrdersContextValue = {
  orders: Order[];
  mode: 'seed' | 'supabase';
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  getOrder: (id: string) => Order | undefined;
  placeOrder: (input: PlaceOrderInput, cartItems: CartItem[]) => Promise<Order>;
  advanceFulfilment: (
    orderId: string,
    to: PopFulfilmentStatus,
    actor: AuthUser | 'system',
    note?: string,
  ) => Promise<Order>;
  setStoreStatus: (
    orderId: string,
    to: StoreOrderStatus,
    actor: AuthUser | 'system',
    note?: string,
  ) => Promise<Order>;
  markCollected: (
    orderId: string,
    actor: AuthUser,
    collectionCode: string,
    collectorNote?: string,
  ) => Promise<Order>;
  partnerOrders: (popId: string) => Order[];
  inbox: readonly StubInboxItem[];
  refreshInbox: () => readonly StubInboxItem[];
};

const OrdersContext = createContext<OrdersContextValue | null>(null);

function newId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

function orderRefFromDate(): string {
  const date = new Date();
  const y = String(date.getFullYear()).slice(2);
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const n = String(Math.floor(Math.random() * 900) + 100);
  return `LC-${y}${m}${day}-${n}`;
}

function cloneDemo(): Order[] {
  return DEMO_ORDERS.map((order) => ({
    ...order,
    statusEvents: order.statusEvents.map((event) => ({ ...event })),
    lines: order.lines.map((line) => ({ ...line })),
  }));
}

async function fanOutNotifications(
  order: Order,
  toStatus: PopFulfilmentStatus,
): Promise<void> {
  const pop = order.popId ? findPop(order.popId) : undefined;
  const intents = mapStatusToNotifications({
    toStatus,
    ctx: {
      orderId: order.id,
      orderRef: order.orderRef,
      popName: pop?.name ?? 'your POP',
      popId: order.popId ?? '',
      collectionCode: order.collectionCode,
      itemCount: order.lines.reduce((sum, line) => sum + line.quantity, 0),
    },
    customer: {
      userId: order.customerId ?? 'user-customer-demo',
      audience: 'customer',
      prefs: {
        pushOrderConfirmed: true,
        pushLeftButchery: true,
        pushReadyForCollection: true,
        pushCollected: true,
      },
    },
    partners: order.popId
      ? [
          {
            userId: 'user-partner-uo-demo',
            audience: 'pop_partner',
            prefs: {
              pushOrderConfirmed: true,
              pushLeftButchery: true,
              pushReadyForCollection: true,
              pushCollected: true,
            },
          },
        ]
      : [],
  });
  for (const intent of intents) {
    await dispatchStub(
      intent,
      intent.audience === 'customer'
        ? (order.customerId ?? 'user-customer-demo')
        : 'user-partner-uo-demo',
    );
  }
}

function withDerivedStoreStatus(order: Order): Order {
  return {
    ...order,
    storeStatus: storeStatusForFulfilment(
      order.fulfilmentStatus,
      order.paymentStatus,
    ),
  };
}

export function OrdersProvider({ children }: { children: React.ReactNode }) {
  const mode: 'seed' | 'supabase' = isSupabaseConfigured() ? 'supabase' : 'seed';
  const { getProduct: catalogGet } = useCatalog();
  const { ready: authReady, liveSession, user } = useAuth();
  const [orders, setOrders] = useState<Order[]>(() =>
    mode === 'seed' ? cloneDemo() : [],
  );
  const [loading, setLoading] = useState(mode === 'supabase');
  const [error, setError] = useState<string | null>(null);
  const [inboxVersion, setInboxVersion] = useState(0);

  const refresh = useCallback(async () => {
    if (mode !== 'supabase') return;
    setLoading(true);
    try {
      const rows = await fetchOrders();
      setOrders(rows);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load orders');
    } finally {
      setLoading(false);
    }
  }, [mode]);

  useEffect(() => {
    if (mode !== 'supabase' || !authReady) return;
    void refresh();
  }, [mode, authReady, user?.id, liveSession, refresh]);

  const resolveProduct = useCallback(
    (id: string) => catalogGet(id) ?? seedGetProduct(id),
    [catalogGet],
  );

  const commit = useCallback(
    async (next: Order): Promise<Order> => {
      if (mode === 'supabase') {
        if (!liveSession) {
          throw new Error(
            'Sign in with your shop account before saving an order to the live store.',
          );
        }
        await saveOrder(next, {
          replaceLines: user?.role !== 'pop_partner',
        });
      }
      setOrders((prev) => {
        const exists = prev.some((order) => order.id === next.id);
        if (!exists) return [next, ...prev];
        return prev.map((order) => (order.id === next.id ? next : order));
      });
      setInboxVersion((value) => value + 1);
      return next;
    },
    [mode, liveSession, user?.role],
  );

  const getOrder = useCallback(
    (id: string) => orders.find((order) => order.id === id || order.orderRef === id),
    [orders],
  );

  const placeOrder = useCallback(
    async (input: PlaceOrderInput, cartItems: CartItem[]): Promise<Order> => {
      const lines: OrderLine[] = cartItems.map((item) => {
        const product = resolveProduct(item.productId);
        if (!product) throw new Error('A cart item is no longer in the catalogue.');
        if (item.quantity > product.stockLevel) {
          throw new Error(`${product.name} does not have enough packs.`);
        }
        return {
          productId: product.id,
          productName: product.name,
          quantity: item.quantity,
          unitPriceCents: product.priceCents,
        };
      });
      const totalCents = lines.reduce(
        (sum, line) => sum + line.unitPriceCents * line.quantity,
        0,
      );
      const id = newId('ord');
      const now = new Date().toISOString();
      const event: OrderStatusEvent = {
        id: newId('ev'),
        orderId: id,
        fromStatus: null,
        toStatus: 'placed',
        storeStatus: 'pending_payment',
        createdAt: now,
        actorRole: input.actor.role,
        note: 'Order placed',
      };

      const basePayment = unpaidPaymentFields({ cents: totalCents, currency: 'ZAR' });
      let paymentFields: OrderPaymentFields = {
        ...basePayment,
        paymentStatus: input.deferPayment ? 'pending' : 'none',
        paymentMethod: input.deferPayment ? 'yoco' : undefined,
      };
      if (input.paymentResult) {
        paymentFields = applyPaymentResult(basePayment, input.paymentResult);
      }

      const paid =
        !input.deferPayment &&
        (paymentFields.paymentStatus === 'paid' ||
          paymentFields.paymentStatus === 'authorized');

      const order: Order = {
        id,
        orderRef: orderRefFromDate(),
        createdAt: now,
        customerId: input.actor.id,
        customerName: input.customerName,
        phone: input.phone,
        email: input.email,
        notes: input.notes,
        lines,
        totalCents,
        fulfilment: input.fulfilment,
        popId: input.popId,
        storeStatus: paid ? 'confirmed' : 'pending_payment',
        fulfilmentStatus: paid ? 'confirmed' : 'placed',
        packCheckAcceptedAt: input.packCheckAcceptedAt,
        statusEvents: [event],
        assignedAt: input.popId ? now : undefined,
        whatsappStub: input.fulfilment === 'whatsapp_pickup',
        pickupLocation:
          input.fulfilment === 'whatsapp_pickup' ? 'Piet Retief pickup' : undefined,
        ...paymentFields,
      };

      if (paid) {
        const confirmedAt = new Date().toISOString();
        order.statusEvents.push({
          id: newId('ev'),
          orderId: id,
          fromStatus: 'placed',
          toStatus: 'confirmed',
          storeStatus: 'confirmed',
          createdAt: confirmedAt,
          actorRole: 'system',
          note: 'Payment received',
        });
      }

      const saved = await commit(order);
      if (paid) void fanOutNotifications(saved, 'confirmed');
      return saved;
    },
    [commit, resolveProduct],
  );

  const advanceFulfilment = useCallback(
    async (
      orderId: string,
      to: PopFulfilmentStatus,
      actor: AuthUser | 'system',
      note?: string,
    ): Promise<Order> => {
      const current = orders.find((order) => order.id === orderId);
      if (!current) throw new Error('Order not found');
      assertTransition(current.fulfilmentStatus, to, actor);
      const now = new Date().toISOString();
      const code =
        to === 'ready_for_collection'
          ? (current.collectionCode ?? generateCollectionCode())
          : current.collectionCode;
      const next: Order = withDerivedStoreStatus({
        ...current,
        fulfilmentStatus: to,
        collectionCode: code,
        statusEvents: [
          ...current.statusEvents,
          {
            id: newId('ev'),
            orderId: current.id,
            fromStatus: current.fulfilmentStatus,
            toStatus: to,
            createdAt: now,
            actorRole: actor === 'system' ? 'system' : actor.role,
            note,
            collectionCode: code,
          },
        ],
      });
      if (to === 'dispatched_to_pop') {
        next.dispatchedAt = now;
        next.coldChainClockStartedAt = next.coldChainClockStartedAt ?? now;
      }
      if (to === 'ready_for_collection') next.readyAt = now;
      if (to === 'collected') {
        next.collectedAt = now;
        if (actor !== 'system') next.collectedByUserId = actor.id;
      }
      const saved = await commit(next);
      void fanOutNotifications(saved, to);
      return saved;
    },
    [commit, orders],
  );

  const setStoreStatus = useCallback(
    async (
      orderId: string,
      to: StoreOrderStatus,
      actor: AuthUser | 'system',
      note?: string,
    ): Promise<Order> => {
      const current = orders.find((order) => order.id === orderId);
      if (!current) throw new Error('Order not found');
      if (!canSetStoreStatus(current.storeStatus, to, actor)) {
        throw new Error(`Cannot move this order from ${current.storeStatus} to ${to}`);
      }
      const now = new Date().toISOString();
      const fulfilment = fulfilmentForStoreStatus(to);
      const code =
        to === 'at_pop'
          ? (current.collectionCode ?? generateCollectionCode())
          : current.collectionCode;
      const next: Order = {
        ...current,
        storeStatus: to,
        fulfilmentStatus: fulfilment,
        collectionCode: code,
        statusEvents: [
          ...current.statusEvents,
          {
            id: newId('ev'),
            orderId: current.id,
            fromStatus: current.fulfilmentStatus,
            toStatus: fulfilment,
            storeStatus: to,
            createdAt: now,
            actorRole: actor === 'system' ? 'system' : actor.role,
            note: note ?? `Store status → ${to}`,
            collectionCode: code,
          },
        ],
      };
      if (to === 'paid' || to === 'confirmed') {
        if (next.paymentStatus !== 'paid') {
          next.paymentStatus = 'paid';
          next.paidAt = next.paidAt ?? now;
        }
      }
      if (to === 'left_butchery') {
        next.dispatchedAt = now;
        next.coldChainClockStartedAt = next.coldChainClockStartedAt ?? now;
      }
      if (to === 'at_pop') next.readyAt = now;
      if (to === 'collected') {
        next.collectedAt = now;
        if (actor !== 'system') next.collectedByUserId = actor.id;
        if (note) next.collectorNote = note;
      }
      const saved = await commit(next);
      if (fulfilment !== current.fulfilmentStatus) {
        void fanOutNotifications(saved, fulfilment);
      }
      return saved;
    },
    [commit, orders],
  );

  const markCollected = useCallback(
    async (
      orderId: string,
      actor: AuthUser,
      collectionCode: string,
      collectorNote?: string,
    ): Promise<Order> => {
      const order = orders.find((item) => item.id === orderId);
      if (!order) throw new Error('Order not found');
      if (actor.role === 'pop_partner' && actor.popId && actor.popId !== order.popId) {
        throw new Error('This order is not assigned to your pickup point');
      }
      if (order.storeStatus !== 'at_pop') {
        throw new Error('This order is not ready for collection yet');
      }
      if (!collectionCodesMatch(order.collectionCode, collectionCode)) {
        throw new Error('Collection code does not match');
      }
      return setStoreStatus(
        orderId,
        'collected',
        actor,
        collectorNote ?? 'Handed over at POP',
      );
    },
    [orders, setStoreStatus],
  );

  const partnerOrders = useCallback(
    (popId: string) =>
      orders.filter(
        (order) =>
          order.popId === popId &&
          (['left_butchery', 'at_pop', 'collected'].includes(order.storeStatus) ||
            ['dispatched_to_pop', 'ready_for_collection', 'collected', 'no_show'].includes(
              order.fulfilmentStatus,
            )),
      ),
    [orders],
  );

  const refreshInbox = useCallback(() => {
    setInboxVersion((value) => value + 1);
    return getStubInbox();
  }, []);

  const inbox = useMemo(() => {
    void inboxVersion;
    return getStubInbox();
  }, [inboxVersion]);

  const value = useMemo(
    () => ({
      orders,
      mode,
      loading,
      error,
      refresh,
      getOrder,
      placeOrder,
      advanceFulfilment,
      setStoreStatus,
      markCollected,
      partnerOrders,
      inbox,
      refreshInbox,
    }),
    [
      orders,
      mode,
      loading,
      error,
      refresh,
      getOrder,
      placeOrder,
      advanceFulfilment,
      setStoreStatus,
      markCollected,
      partnerOrders,
      inbox,
      refreshInbox,
    ],
  );

  return <OrdersContext.Provider value={value}>{children}</OrdersContext.Provider>;
}

export function useOrders(): OrdersContextValue {
  const ctx = useContext(OrdersContext);
  if (!ctx) throw new Error('useOrders must be used within OrdersProvider');
  return ctx;
}
