import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';
import { applyPaymentResult, unpaidPaymentFields } from '../payments/orderPaymentFields';
import type { OrderPaymentFields, PaymentResult } from '../payments/types';
import { generateCollectionCode } from '../pop/collectionCode';
import { findPop } from '../pop/popStore';
import { assertTransition } from '../pop/statusMachine';
import type { AuthUser, PopFulfilmentStatus } from '../pop/types';
import {
  dispatchStub,
  getStubInbox,
  type StubInboxItem,
} from '../notifications/StubNotificationDispatcher';
import { mapStatusToNotifications } from '../notifications/mapStatusToNotifications';
import { DEMO_ORDERS, getProduct as seedGetProduct } from '../data/seed';
import type {
  CartItem,
  FulfilmentMethod,
  Order,
  OrderLine,
  OrderStatusEvent,
} from '../data/types';
import { useCatalog } from './CatalogContext';

type PlaceOrderInput = {
  customerName: string,
  phone: string,
  email?: string,
  notes?: string,
  fulfilment: FulfilmentMethod,
  popId?: string,
  packCheckAcceptedAt: string,
  paymentResult: PaymentResult,
  actor: AuthUser;
};

type OrdersContextValue = {
  orders: Order[],
  getOrder: (id: string) => Order | undefined;
  placeOrder: (input: PlaceOrderInput, cartItems: CartItem[]) => Order;
  advanceFulfilment: (
    orderId: string,
    to: PopFulfilmentStatus,
    actor: AuthUser | 'system',
    note?: string
  ) => Order;
  markCollected: (
    orderId: string,
    actor: AuthUser,
    collectionCode: string,
    collectorNote?: string
  ) => Order;
  partnerOrders: (popId: string) => Order[];
  inbox: readonly StubInboxItem[],
  refreshInbox: () => readonly StubInboxItem[];
};

const OrdersContext = createContext<OrdersContextValue | null>(null);

function newId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 6)}`;
}

function orderRefFromDate(): string {
  const d = new Date();
  const y = String(d.getFullYear()).slice(2);
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const n = String(Math.floor(Math.random() * 900) + 100);
  return `LC-${y}${m}${day}-${n}`;
}

async function fanOutNotifications(
  order: Order,
  toStatus: PopFulfilmentStatus
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
      itemCount: order.lines.reduce((n, l) => n + l.quantity, 0),
    },
    customer: {
      userId: 'user-customer-demo',
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
        ? 'user-customer-demo'
        : 'user-partner-uo-demo'
    );
  }
}

export function OrdersProvider({ children }: { children: React.ReactNode }) {
  const { getProduct: catalogGet } = useCatalog();
  const [orders, setOrders] = useState<Order[]>(() =>
    DEMO_ORDERS.map((o) => ({
      ...o,
      statusEvents: o.statusEvents.map((e) => ({ ...e })),
      lines: o.lines.map((l) => ({ ...l })),
    }))
  );
  const [inboxVersion, setInboxVersion] = useState(0);

  const resolveProduct = useCallback(
    (id: string) => catalogGet(id) ?? seedGetProduct(id),
    [catalogGet]
  );

  const getOrder = useCallback(
    (id: string) => orders.find((o) => o.id === id || o.orderRef === id),
    [orders]
  );

  const placeOrder = useCallback(
    (input: PlaceOrderInput, cartItems: CartItem[]): Order => {
      const lines: OrderLine[] = cartItems.map((item) => {
        const p = resolveProduct(item.productId)!;
        return {
          productId: p.id,
          productName: p.name,
          quantity: item.quantity,
          unitPriceCents: p.priceCents,
        };
      });
      const totalCents = lines.reduce(
        (s, l) => s + l.unitPriceCents * l.quantity,
        0
      );
      const id = newId('ord');
      const now = new Date().toISOString();
      const event: OrderStatusEvent = {
        id: newId('ev'),
        orderId: id,
        fromStatus: null,
        toStatus: 'placed',
        createdAt: now,
        actorRole: input.actor.role,
        note: 'Order placed',
      };

      const paymentFields: OrderPaymentFields = applyPaymentResult(
        unpaidPaymentFields({ cents: totalCents, currency: 'ZAR' }),
        input.paymentResult
      );

      const order: Order = {
        id,
        orderRef: orderRefFromDate(),
        createdAt: now,
        customerName: input.customerName,
        phone: input.phone,
        email: input.email,
        notes: input.notes,
        lines,
        totalCents,
        fulfilment: input.fulfilment,
        popId: input.popId,
        fulfilmentStatus: 'placed',
        packCheckAcceptedAt: input.packCheckAcceptedAt,
        statusEvents: [event],
        assignedAt: input.popId ? now : undefined,
        whatsappStub: input.fulfilment === 'whatsapp_pickup',
        pickupLocation:
          input.fulfilment === 'whatsapp_pickup'
            ? 'Piet Retief pickup (December trial)'
            : undefined,
        ...paymentFields,
      };

      // Auto-confirm after successful stub/live pay
      if (input.paymentResult.ok) {
        const confirmedAt = new Date().toISOString();
        order.fulfilmentStatus = 'confirmed';
        order.statusEvents.push({
          id: newId('ev'),
          orderId: id,
          fromStatus: 'placed',
          toStatus: 'confirmed',
          createdAt: confirmedAt,
          actorRole: 'system',
          note: 'Payment accepted (stub/demo)',
        });
        void fanOutNotifications(order, 'confirmed');
      }

      setOrders((prev) => [order, ...prev]);
      setInboxVersion((v) => v + 1);
      return order;
    },
    [resolveProduct]
  );

  const advanceFulfilment = useCallback(
    (
      orderId: string,
      to: PopFulfilmentStatus,
      actor: AuthUser | 'system',
      note?: string
    ): Order => {
      let updated: Order | undefined;
      setOrders((prev) => {
        const current = prev.find((o) => o.id === orderId);
        if (!current) throw new Error('Order not found');
        assertTransition(current.fulfilmentStatus, to, actor);
        const now = new Date().toISOString();
        const code =
          to === 'ready_for_collection'
            ? current.collectionCode ?? generateCollectionCode()
            : current.collectionCode;
        const next: Order = {
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
        };
        if (to === 'dispatched_to_pop') {
          next.dispatchedAt = now;
          next.coldChainClockStartedAt = next.coldChainClockStartedAt ?? now;
        }
        if (to === 'ready_for_collection') {
          next.readyAt = now;
        }
        if (to === 'collected') {
          next.collectedAt = now;
          if (actor !== 'system') next.collectedByUserId = actor.id;
        }
        updated = next;
        void fanOutNotifications(next, to);
        return prev.map((o) => (o.id === orderId ? next : o));
      });
      setInboxVersion((v) => v + 1);
      if (!updated) throw new Error('Order not found');
      return updated;
    },
    []
  );

  const markCollected = useCallback(
    (
      orderId: string,
      actor: AuthUser,
      collectionCode: string,
      collectorNote?: string
    ): Order => {
      const order = orders.find((o) => o.id === orderId);
      if (!order) throw new Error('Order not found');
      if (
        order.collectionCode &&
        order.collectionCode.toUpperCase() !==
          collectionCode.trim().toUpperCase()
      ) {
        throw new Error('Collection code does not match');
      }
      const next = advanceFulfilment(
        orderId,
        'collected',
        actor,
        collectorNote ?? 'Handed over at POP'
      );
      const withNote = { ...next, collectorNote: collectorNote ?? next.collectorNote };
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? withNote : o))
      );
      return withNote;
    },
    [advanceFulfilment, orders]
  );

  const partnerOrders = useCallback(
    (popId: string) =>
      orders.filter(
        (o) =>
          o.popId === popId &&
          ['dispatched_to_pop', 'ready_for_collection', 'collected', 'no_show'].includes(
            o.fulfilmentStatus
          )
      ),
    [orders]
  );

  const refreshInbox = useCallback(() => {
    setInboxVersion((v) => v + 1);
    return getStubInbox();
  }, []);

  const inbox = useMemo(() => {
    void inboxVersion;
    return getStubInbox();
  }, [inboxVersion]);

  const value = useMemo(
    () => ({
      orders,
      getOrder,
      placeOrder,
      advanceFulfilment,
      markCollected,
      partnerOrders,
      inbox,
      refreshInbox,
    }),
    [
      orders,
      getOrder,
      placeOrder,
      advanceFulfilment,
      markCollected,
      partnerOrders,
      inbox,
      refreshInbox,
    ]
  );

  return (
    <OrdersContext.Provider value={value}>{children}</OrdersContext.Provider>
  );
}

export function useOrders(): OrdersContextValue {
  const ctx = useContext(OrdersContext);
  if (!ctx) throw new Error('useOrders must be used within OrdersProvider');
  return ctx;
}
