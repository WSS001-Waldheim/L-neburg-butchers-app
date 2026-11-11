import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { PRODUCTS, assertStockRules } from '../data/seed';
import { fetchProducts, removeProduct, saveProduct } from '../data/remoteStore';
import { isSupabaseConfigured } from '../data/supabaseClient';
import type { Product, ProductSection } from '../data/types';

export type ProductInput = Omit<Product, 'id'> & { id?: string };

type CatalogContextValue = {
  products: Product[];
  mode: 'seed' | 'supabase';
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  getProduct: (id: string) => Product | undefined;
  productsForBatch: (batchId: string) => Product[];
  productsBySection: (section: ProductSection) => Product[];
  upsertProduct: (input: ProductInput) => Promise<Product>;
  deleteProduct: (id: string) => Promise<void>;
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

function cloneSeed(): Product[] {
  return PRODUCTS.map((product) => ({ ...product }));
}

export function CatalogProvider({ children }: { children: React.ReactNode }) {
  const mode: 'seed' | 'supabase' = isSupabaseConfigured() ? 'supabase' : 'seed';
  const [products, setProducts] = useState<Product[]>(() =>
    mode === 'seed' ? cloneSeed() : [],
  );
  const [loading, setLoading] = useState(mode === 'supabase');
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (mode !== 'supabase') return;
    setLoading(true);
    try {
      const rows = await fetchProducts();
      setProducts(rows);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load the catalogue');
    } finally {
      setLoading(false);
    }
  }, [mode]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const getProduct = useCallback(
    (id: string) => products.find((product) => product.id === id),
    [products],
  );

  const productsForBatch = useCallback(
    (batchId: string) => products.filter((product) => product.carcassBatchId === batchId),
    [products],
  );

  const productsBySection = useCallback(
    (section: ProductSection) => products.filter((product) => product.section === section),
    [products],
  );

  const upsertProduct = useCallback(
    async (input: ProductInput): Promise<Product> => {
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
      if (mode === 'supabase') await saveProduct(next);
      setProducts((prev) => {
        const idx = prev.findIndex((product) => product.id === id);
        if (idx >= 0) {
          const copy = [...prev];
          copy[idx] = next;
          return copy;
        }
        return [...prev, next];
      });
      return next;
    },
    [mode],
  );

  const deleteProduct = useCallback(
    async (id: string) => {
      if (mode === 'supabase') await removeProduct(id);
      setProducts((prev) => prev.filter((product) => product.id !== id));
    },
    [mode],
  );

  const value = useMemo(
    () => ({
      products,
      mode,
      loading,
      error,
      refresh,
      getProduct,
      productsForBatch,
      productsBySection,
      upsertProduct,
      deleteProduct,
    }),
    [
      products,
      mode,
      loading,
      error,
      refresh,
      getProduct,
      productsForBatch,
      productsBySection,
      upsertProduct,
      deleteProduct,
    ],
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
