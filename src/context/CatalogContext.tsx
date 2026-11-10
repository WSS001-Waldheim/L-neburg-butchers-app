import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';
import { PRODUCTS, assertStockRules } from '../data/seed';
import type { Product, ProductSection } from '../data/types';

export type ProductInput = Omit<Product, 'id'> & { id?: string };

type CatalogContextValue = {
  products: Product[];
  getProduct: (id: string) => Product | undefined;
  productsForBatch: (batchId: string) => Product[];
  productsBySection: (section: ProductSection) => Product[];
  upsertProduct: (input: ProductInput) => Product;
  deleteProduct: (id: string) => void;
};

const CatalogContext = createContext<CatalogContextValue | null>(null);

function newProductId(section: ProductSection, name: string): string {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 24);
  const prefix =
    section === 'premium-vsp'
      ? 'vsp'
      : section === 'braai-boxes'
        ? 'braai'
        : 'sausage';
  return `${prefix}-${slug || 'item'}-${Date.now().toString(36).slice(-4)}`;
}

export function CatalogProvider({ children }: { children: React.ReactNode }) {
  const [products, setProducts] = useState<Product[]>(() =>
    PRODUCTS.map((p) => ({ ...p }))
  );

  const getProduct = useCallback(
    (id: string) => products.find((p) => p.id === id),
    [products]
  );

  const productsForBatch = useCallback(
    (batchId: string) => products.filter((p) => p.carcassBatchId === batchId),
    [products]
  );

  const productsBySection = useCallback(
    (section: ProductSection) => products.filter((p) => p.section === section),
    [products]
  );

  const upsertProduct = useCallback((input: ProductInput): Product => {
    const id = input.id?.trim() || newProductId(input.section, input.name);
    const next: Product = {
      id,
      name: input.name.trim(),
      section: input.section,
      description: input.description.trim(),
      priceCents: Math.max(0, Math.round(input.priceCents)),
      unitLabel: input.unitLabel.trim() || 'each',
      weightGrams: input.weightGrams,
      cutNotes: input.cutNotes?.trim() || undefined,
      imageHint: input.imageHint.trim() || 'cut',
      photoUri: input.photoUri?.trim() || null,
      stockLevel: Math.max(0, Math.round(input.stockLevel)),
      lowStockThreshold: Math.max(0, Math.round(input.lowStockThreshold)),
      nextArrivalAt: input.nextArrivalAt,
      carcassBatchId: input.carcassBatchId,
    };
    assertStockRules([next]);
    setProducts((prev) => {
      const idx = prev.findIndex((p) => p.id === id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = next;
        return copy;
      }
      return [...prev, next];
    });
    return next;
  }, []);

  const deleteProduct = useCallback((id: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const value = useMemo(
    () => ({
      products,
      getProduct,
      productsForBatch,
      productsBySection,
      upsertProduct,
      deleteProduct,
    }),
    [
      products,
      getProduct,
      productsForBatch,
      productsBySection,
      upsertProduct,
      deleteProduct,
    ]
  );

  return (
    <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>
  );
}

export function useCatalog(): CatalogContextValue {
  const ctx = useContext(CatalogContext);
  if (!ctx) throw new Error('useCatalog must be used within CatalogProvider');
  return ctx;
}
