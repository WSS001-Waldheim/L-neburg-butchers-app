import { FARM_PLACE } from './place';
import type { CarcassBatch, Order, Product } from './types';

export const BATCHES: CarcassBatch[] = [
  {
    id: 'batch-ox-214',
    earTag: 'ODB-214',
    carcassNumber: 'LC-2026-0142',
    qrCode: 'LC-2026-0142',
    breed: 'Drakensberg',
    bornAt: '2023-04-12',
    raisedAt: FARM_PLACE,
    finishedAt: '2026-09-28',
    processedAt: '2026-10-02',
    story:
      'Born on Ouderdam under the Drakensberg foothills. Raised on our own pastures by the Lüneburg family — the same land and the same standards since 1946. Finished slowly for yellow fat and marbling that hold up in vacuum skin pack.',
    butchersNote:
      'Carcass LC-2026-0142 was broken by father and brother Ruben. Ear tag ODB-214 linked in Cleaver. Packs from this carcass carry one shared QR for the batch story.',
  },
  {
    id: 'batch-ox-198',
    earTag: 'ODB-198',
    carcassNumber: 'LC-2026-0118',
    qrCode: 'LC-2026-0118',
    breed: 'Drakensberg',
    bornAt: '2023-02-03',
    raisedAt: FARM_PLACE,
    finishedAt: '2026-08-15',
    processedAt: '2026-08-19',
    story:
      'A quiet animal with strong frame — typical of our Drakensberg line. Grazed the same camps as his sire. We wait for the fat colour and size we want before we cut.',
    butchersNote:
      'Used primarily for braai-box and sausage trim after premium steaks were pulled. Traceability still runs ear tag → carcass → pack QR.',
  },
];

export const PRODUCTS: Product[] = [
  {
    id: 'vsp-ribeye',
    name: 'Ribeye VSP',
    section: 'premium-vsp',
    description:
      'C-grade ribeye from our own Drakensberg cattle. Vacuum skin packed — cut for size, yellow fat, and marbling.',
    priceCents: 38900,
    unitLabel: 'per pack (~400g)',
    weightGrams: 400,
    cutNotes: 'Big steak size · yellow fat · marbling',
    imageHint: 'ribeye',
    stockLevel: 6,
    lowStockThreshold: 4,
    nextArrivalAt: '2026-11-12T08:00:00+02:00',
    carcassBatchId: 'batch-ox-214',
  },
  {
    id: 'vsp-sirloin',
    name: 'Sirloin VSP',
    section: 'premium-vsp',
    description:
      'Premium sirloin, VSP. Own cattle only — we do not buy in for this line.',
    priceCents: 34900,
    unitLabel: 'per pack (~380g)',
    weightGrams: 380,
    cutNotes: 'Actual size on the pack · yellow fat',
    imageHint: 'sirloin',
    stockLevel: 2,
    lowStockThreshold: 4,
    nextArrivalAt: '2026-11-12T08:00:00+02:00',
    carcassBatchId: 'batch-ox-214',
  },
  {
    id: 'vsp-fillet',
    name: 'Fillet VSP',
    section: 'premium-vsp',
    description:
      'Fillet steaks in vacuum skin pack. Limited by carcass yield — when it is gone, the next date is on the listing.',
    priceCents: 42900,
    unitLabel: 'per pack (~350g)',
    weightGrams: 350,
    cutNotes: 'Centre-cut · marbling where the animal gives it',
    imageHint: 'fillet',
    stockLevel: 0,
    lowStockThreshold: 3,
    nextArrivalAt: '2026-11-18T08:00:00+02:00',
    carcassBatchId: 'batch-ox-214',
  },
  {
    id: 'vsp-rump',
    name: 'Rump VSP',
    section: 'premium-vsp',
    description:
      'Rump steak, VSP. Same cattle, same yard, same cut discipline.',
    priceCents: 29900,
    unitLabel: 'per pack (~400g)',
    weightGrams: 400,
    cutNotes: 'Large portion · yellow fat edge',
    imageHint: 'rump',
    stockLevel: 11,
    lowStockThreshold: 4,
    nextArrivalAt: '2026-11-20T08:00:00+02:00',
    carcassBatchId: 'batch-ox-214',
  },
  {
    id: 'braai-family',
    name: 'Family Braai Box',
    section: 'braai-boxes',
    description:
      'Mixed everyday cuts for the fire — chops, wors pieces, and braai steaks. Built for the existing customer base.',
    priceCents: 65000,
    unitLabel: 'box (~2.5kg)',
    weightGrams: 2500,
    imageHint: 'braai-box',
    stockLevel: 18,
    lowStockThreshold: 5,
    nextArrivalAt: '2026-11-08T08:00:00+02:00',
    carcassBatchId: 'batch-ox-198',
  },
  {
    id: 'braai-weekend',
    name: 'Weekend Braai Box',
    section: 'braai-boxes',
    description:
      'Smaller mixed box for two to four. Honest country cuts, no fuss.',
    priceCents: 42000,
    unitLabel: 'box (~1.5kg)',
    weightGrams: 1500,
    imageHint: 'braai-weekend',
    stockLevel: 3,
    lowStockThreshold: 5,
    nextArrivalAt: '2026-11-08T08:00:00+02:00',
    carcassBatchId: 'batch-ox-198',
  },
  {
    id: 'braai-boere',
    name: 'Boerewors Braai Pack',
    section: 'braai-boxes',
    description:
      'Traditional boerewors pack ready for the grid. Part of the everyday range.',
    priceCents: 18900,
    unitLabel: '1kg',
    weightGrams: 1000,
    imageHint: 'boerewors',
    stockLevel: 0,
    lowStockThreshold: 6,
    nextArrivalAt: '2026-11-05T08:00:00+02:00',
    carcassBatchId: 'batch-ox-198',
  },
  {
    id: 'sausage-medwurst',
    name: 'Medwurst',
    section: 'sausages',
    description: 'German-style Medwurst. Made in the butchery to the house recipe.',
    priceCents: 16500,
    unitLabel: '500g',
    weightGrams: 500,
    imageHint: 'medwurst',
    stockLevel: 14,
    lowStockThreshold: 4,
    nextArrivalAt: '2026-11-10T08:00:00+02:00',
    carcassBatchId: null,
  },
  {
    id: 'sausage-bratwurst',
    name: 'Bratwurst',
    section: 'sausages',
    description: 'German-style Bratwurst for the pan or the fire.',
    priceCents: 15500,
    unitLabel: '500g',
    weightGrams: 500,
    imageHint: 'bratwurst',
    stockLevel: 1,
    lowStockThreshold: 4,
    nextArrivalAt: '2026-11-10T08:00:00+02:00',
    carcassBatchId: null,
  },
  {
    id: 'sausage-buddhawurst',
    name: 'Buddhawurst',
    section: 'sausages',
    description: 'Salt & pepper style Buddhawurst — clean seasoning, no compromise.',
    priceCents: 17500,
    unitLabel: '500g',
    weightGrams: 500,
    imageHint: 'buddhawurst',
    stockLevel: 8,
    lowStockThreshold: 4,
    nextArrivalAt: '2026-11-10T08:00:00+02:00',
    carcassBatchId: null,
  },
];

export function assertStockRules(products: Product[] = PRODUCTS): void {
  for (const p of products) {
    if (p.stockLevel <= p.lowStockThreshold && !p.nextArrivalAt) {
      throw new Error(`Stock rule: ${p.id} needs nextArrivalAt`);
    }
  }
}

assertStockRules();

export const SECTION_META: Record<
  Product['section'],
  { title: string; blurb: string }
> = {
  'premium-vsp': {
    title: 'Premium VSP Steaks',
    blurb: 'Own Drakensberg cattle. Vacuum skin pack. Cut for size and fat.',
  },
  'braai-boxes': {
    title: 'Braai Boxes',
    blurb: 'Everyday packs for the fire — same yard, familiar range.',
  },
  sausages: {
    title: 'German-style Sausages',
    blurb: 'Medwurst, Bratwurst, and Buddhawurst from the butchery.',
  },
};

export const LOCAL_DELIVERY_TOWNS = [
  'Piet Retief',
  'Vryheid',
  'Paulpietersburg',
] as const;

export const DEMO_ORDERS: Order[] = [
  {
    id: 'ord-demo-001',
    orderRef: 'LC-261020-014',
    createdAt: '2026-10-20T14:22:00+02:00',
    customerId: 'user-customer-demo',
    fulfilment: 'pop_collect',
    popId: 'ultimate-outdoor-piet-retief',
    storeStatus: 'confirmed',
    fulfilmentStatus: 'packing',
    packCheckAcceptedAt: '2026-10-20T14:20:00+02:00',
    paymentStatus: 'paid',
    amountEstimated: { cents: 94300, currency: 'ZAR' },
    paymentMethod: 'stub',
    customerName: 'Demo Customer',
    phone: '+27 82 000 0000',
    lines: [
      {
        productId: 'vsp-ribeye',
        productName: 'Ribeye VSP',
        quantity: 2,
        unitPriceCents: 38900,
      },
      {
        productId: 'sausage-medwurst',
        productName: 'Medwurst',
        quantity: 1,
        unitPriceCents: 16500,
      },
    ],
    totalCents: 94300,
    statusEvents: [
      {
        id: 'ev-demo-1',
        orderId: 'ord-demo-001',
        fromStatus: null,
        toStatus: 'placed',
        createdAt: '2026-10-20T14:20:00+02:00',
      },
      {
        id: 'ev-demo-2',
        orderId: 'ord-demo-001',
        fromStatus: 'placed',
        toStatus: 'confirmed',
        createdAt: '2026-10-20T14:21:00+02:00',
      },
      {
        id: 'ev-demo-3',
        orderId: 'ord-demo-001',
        fromStatus: 'confirmed',
        toStatus: 'packing',
        createdAt: '2026-10-20T14:22:00+02:00',
      },
    ],
  },
];

export function getProduct(id: string): Product | undefined {
  return PRODUCTS.find((p) => p.id === id);
}

export function getBatch(id: string): CarcassBatch | undefined {
  return BATCHES.find((b) => b.id === id);
}

export function getBatchByQr(code: string): CarcassBatch | undefined {
  const normalised = decodeURIComponent(code).trim().toUpperCase();
  return BATCHES.find(
    (b) =>
      b.qrCode.toUpperCase() === normalised ||
      b.carcassNumber.toUpperCase() === normalised
  );
}

export function productsForBatch(batchId: string): Product[] {
  return PRODUCTS.filter((p) => p.carcassBatchId === batchId);
}
